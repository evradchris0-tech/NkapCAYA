import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, SessionStatus, TransactionType, SavingsEntryType } from '@prisma/client';
import { SessionsRepository } from '../repositories/sessions.repository';
import { RecordEntryDto } from '../dto/record-entry.dto';
import * as dayjs from 'dayjs';

/** TransactionType → 3-4 char code for reference generation */
const TYPE_CODE: Record<TransactionType, string> = {
  INSCRIPTION: 'INS',
  SECOURS: 'SEC',
  COTISATION: 'COT',
  POT: 'POT',
  RBT_PRINCIPAL: 'RBTP',
  RBT_INTEREST: 'RBTI',
  EPARGNE: 'EPG',
  PROJET: 'PRJ',
  AUTRES: 'AUT',
};

/** TransactionType → MonthlySession total field */
const TOTAL_FIELD: Record<TransactionType, string> = {
  INSCRIPTION: 'totalInscription',
  SECOURS: 'totalSecours',
  COTISATION: 'totalCotisation',
  POT: 'totalPot',
  RBT_PRINCIPAL: 'totalRbtPrincipal',
  RBT_INTEREST: 'totalRbtInterest',
  EPARGNE: 'totalEpargne',
  PROJET: 'totalProjet',
  AUTRES: 'totalAutres',
};

/** Types that also create a SavingsEntry(DEPOSIT) */
const SAVINGS_TYPES = new Set<TransactionType>([
  TransactionType.COTISATION,
  TransactionType.EPARGNE,
]);

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async getSession(sessionId: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);
    return session;
  }

  async getSessionsByFiscalYear(fiscalYearId: string) {
    return this.sessionsRepository.findByFiscalYear(fiscalYearId);
  }

  /** DRAFT → OPEN (SESS-04 : session précédente doit être CLOSED) */
  async openSession(sessionId: string, actorId: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    if (session.status !== SessionStatus.DRAFT) {
      throw new ConflictException(
        `Session is ${session.status}, expected DRAFT`,
      );
    }

    // SESS-04 : vérifier que la session précédente (N-1) est CLOSED
    if (session.sessionNumber > 1) {
      const previous = await this.sessionsRepository.findPreviousSession(
        session.fiscalYearId,
        session.sessionNumber,
      );
      if (!previous || previous.status !== SessionStatus.CLOSED) {
        throw new ConflictException(
          `Session ${session.sessionNumber - 1} must be CLOSED before opening session ${session.sessionNumber}`,
        );
      }
    }

    return this.sessionsRepository.updateStatus(sessionId, SessionStatus.OPEN, {
      openedAt: new Date(),
      openedById: actorId,
    });
  }

  /** CLOSED → OPEN (M-03 : reopen par SUPER_ADMIN uniquement) */
  async reopenSession(sessionId: string, actorId: string, reason: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    if (session.status !== SessionStatus.CLOSED) {
      throw new ConflictException(
        `Session is ${session.status}, expected CLOSED to reopen`,
      );
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('A reason must be provided to reopen a closed session');
    }

    return this.sessionsRepository.updateStatus(sessionId, SessionStatus.OPEN, {});
  }

  /** Enregistrer une transaction dans une session ouverte */
  async recordEntry(
    sessionId: string,
    dto: RecordEntryDto,
    actorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // SESS-01 : la session doit être OPEN
      const session = await tx.monthlySession.findUnique({
        where: { id: sessionId },
        include: { fiscalYear: { include: { config: true } } },
      });
      if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

      if (session.status !== SessionStatus.OPEN) {
        if (!dto.isOutOfSession) {
          throw new ConflictException(
            `Session is ${session.status}; only out-of-session entries allowed`,
          );
        }
      }

      // C-03 : Validation stricte des types de transactions hors-session (SESS-02)
      if (dto.isOutOfSession) {
        const allowedTypes: TransactionType[] = [TransactionType.RBT_PRINCIPAL, TransactionType.RBT_INTEREST];
        if (!allowedTypes.includes(dto.type)) {
          throw new BadRequestException(
            `Type ${dto.type} is not allowed for out-of-session entry. Only ${allowedTypes.join(', ')} are permitted.`,
          );
        }
      }

      // Vérifier que le membership appartient au fiscal year
      const membership = await tx.membership.findFirst({
        where: { id: dto.membershipId, fiscalYearId: session.fiscalYearId },
      });
      if (!membership) {
        throw new NotFoundException(
          `Membership ${dto.membershipId} not found in this fiscal year`,
        );
      }

      // Générer la référence CAYA-YYYY-MM-TYPE-NNNN
      const reference = await this.generateReference(
        session,
        dto.type,
        tx,
      );

      // Créer le SessionEntry
      const entry = await this.sessionsRepository.createEntry(
        {
          reference,
          sessionId: dto.isOutOfSession ? null : sessionId,
          membershipId: dto.membershipId,
          type: dto.type,
          amount: dto.amount,
          loanId: dto.loanId ?? null,
          isOutOfSession: dto.isOutOfSession ?? false,
          outOfSessionRef: dto.outOfSessionRef ?? null,
          notes: dto.notes ?? null,
          recordedById: actorId,
          recordedAt: new Date(),
        },
        tx,
      );

      // Incrémenter le total session correspondant (si la session n'est pas out-of-session)
      if (!dto.isOutOfSession) {
        const field = TOTAL_FIELD[dto.type];
        await this.sessionsRepository.incrementSessionTotal(
          sessionId,
          field,
          dto.amount,
          tx,
        );
      }

      // Si type COTISATION ou EPARGNE → créer SavingsEntry + update SavingsLedger
      if (SAVINGS_TYPES.has(dto.type)) {
        await this.recordSavingsDeposit(
          dto.membershipId,
          dto.amount,
          sessionId,
          entry.id,
          session.sessionNumber,
          tx,
        );
      }

      // Si type SECOURS → update RescueFundPosition et RescueFundLedger
      if (dto.type === TransactionType.SECOURS) {
        const Decimal = (await import('decimal.js')).default;
        const position = await tx.rescueFundPosition.findUnique({
          where: { membershipId: dto.membershipId }
        });
        if (!position) {
          throw new BadRequestException(`Aucune position trouvée dans la caisse de secours pour ce membre.`);
        }
        const deposit = new Decimal(dto.amount);
        const newPaidAmount = new Decimal(position.paidAmount.toString()).plus(deposit);
        const newBalance = new Decimal(position.balance.toString()).plus(deposit);
        const newRefillDebt = Decimal.max(new Decimal(0), new Decimal(position.refillDebt.toString()).minus(deposit));

        await tx.rescueFundPosition.update({
          where: { id: position.id },
          data: {
             paidAmount: newPaidAmount.toFixed(2),
             balance: newBalance.toFixed(2),
             refillDebt: newRefillDebt.toFixed(2)
          }
        });

        await tx.rescueFundLedger.update({
          where: { id: position.ledgerId },
          data: {
             totalBalance: { increment: dto.amount }
          }
        });
      }

      return entry;
    });
  }

  /** OPEN → REVIEWING */
  async closeForReview(sessionId: string, actorId: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    if (session.status !== SessionStatus.OPEN) {
      throw new ConflictException(
        `Session is ${session.status}, expected OPEN`,
      );
    }

    return this.sessionsRepository.updateStatus(
      sessionId,
      SessionStatus.REVIEWING,
      { closedAt: new Date(), closedById: actorId },
    );
  }

  /** REVIEWING → CLOSED + distribution des intérêts (atomique) */
  async validateAndClose(sessionId: string, actorId: string) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    if (session.status !== SessionStatus.REVIEWING) {
      throw new ConflictException(
        `Session is ${session.status}, expected REVIEWING`,
      );
    }

    // Les deux opérations dans une seule transaction : si updateStatus échoue,
    // la distribution d'intérêts est rollbackée (état cohérent garanti).
    return this.prisma.$transaction(async (tx) => {
      await this.distributeInterests(session, actorId, tx);
      return this.sessionsRepository.updateStatus(
        sessionId,
        SessionStatus.CLOSED,
        { closedAt: new Date(), closedById: actorId },
        tx,
      );
    });
  }

  // ───────────────────────────────── Private helpers ──────────────────────────

  /** Format : CAYA-YYYY-MM-{TYPE}-NNNN */
  private async generateReference(
    session: { fiscalYearId: string; sessionNumber: number; fiscalYear: { startDate: Date } },
    type: TransactionType,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const startDate = dayjs(session.fiscalYear.startDate);
    const sessionMonth = startDate.add(session.sessionNumber - 1, 'month');
    const yyyy = sessionMonth.format('YYYY');
    const mm = sessionMonth.format('MM');
    const code = TYPE_CODE[type];

    // M-04 : Génération atomique de la référence avec TransactionSequence
    const seqRecord = await tx.transactionSequence.upsert({
      where: { fiscalYearId_sessionNumber_txType: { fiscalYearId: session.fiscalYearId, sessionNumber: session.sessionNumber, txType: type } },
      create: { fiscalYearId: session.fiscalYearId, sessionNumber: session.sessionNumber, txType: type, lastSequence: 1 },
      update: { lastSequence: { increment: 1 } }
    });

    const seq = String(seqRecord.lastSequence).padStart(4, '0');

    return `CAYA-${yyyy}-${mm}-${code}-${seq}`;
  }

  /** Créer SavingsEntry(DEPOSIT) et mettre à jour SavingsLedger */
  private async recordSavingsDeposit(
    membershipId: string,
    amount: number,
    sessionId: string,
    sessionEntryId: string,
    month: number,
    tx: Prisma.TransactionClient,
  ) {
    const ledger = await tx.savingsLedger.findUnique({
      where: { membershipId },
    });
    if (!ledger) {
      throw new BadRequestException(
        `No savings ledger found for membership ${membershipId}`,
      );
    }

    const newBalance = Number(ledger.balance) + amount;
    const newPrincipal = Number(ledger.principalBalance) + amount;

    await tx.savingsEntry.create({
      data: {
        ledgerId: ledger.id,
        sessionId,
        sessionEntryId,
        month,
        amount,
        type: SavingsEntryType.DEPOSIT,
        balanceAfter: newBalance,
      },
    });

    await tx.savingsLedger.update({
      where: { id: ledger.id },
      data: {
        balance: newBalance,
        principalBalance: newPrincipal,
      },
    });
  }

  /**
   * Distribute interest pool proportionally among all savings ledgers.
   * Interest pool = Σ SessionEntry[RBT_INTEREST, sessionId].amount (ACTUAL method)
   * or Σ MonthlyLoanAccrual[sessionId].interestAccrued (THEORETICAL method).
   *
   * Accepts an optional external `tx` to run within a parent transaction (used by
   * validateAndClose so the entire close+distribute is atomic).
   */
  private async distributeInterests(
    session: {
      id: string;
      fiscalYearId: string;
      sessionNumber: number;
      fiscalYear: { config: { interestPoolMethod: string } | null; startDate: Date };
    },
    actorId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const Decimal = (await import('decimal.js')).default;

    const run = async (tx: Prisma.TransactionClient) => {
      const config = session.fiscalYear.config;
      const method = config?.interestPoolMethod ?? 'THEORETICAL';

      // 1. Calculer totalInterestPool
      let totalInterestPool = new Decimal(0);

      if (method === 'ACTUAL') {
        const rbtEntries = await tx.sessionEntry.findMany({
          where: { sessionId: session.id, type: TransactionType.RBT_INTEREST },
        });
        for (const e of rbtEntries) {
          totalInterestPool = totalInterestPool.plus(e.amount.toString());
        }
      } else {
        // THEORETICAL
        const accruals = await tx.monthlyLoanAccrual.findMany({
          where: { sessionId: session.id },
        });
        for (const a of accruals) {
          totalInterestPool = totalInterestPool.plus(a.interestAccrued.toString());
        }
      }

      if (totalInterestPool.isZero()) return; // rien à distribuer

      // 2. Récupérer tous les ledgers actifs + PoolParticipants
      const ledgers = await tx.savingsLedger.findMany({
        where: {
          membership: {
            fiscalYearId: session.fiscalYearId,
            status: 'ACTIVE',
          },
        },
      });

      const poolParticipants = await tx.poolParticipant.findMany({
        where: { fiscalYearId: session.fiscalYearId },
      });

      // totalSavingsBase = Σ ledger.balance + Σ poolParticipant.currentBalance
      let totalSavingsBase = new Decimal(0);
      for (const l of ledgers) totalSavingsBase = totalSavingsBase.plus(l.balance.toString());
      for (const p of poolParticipants) totalSavingsBase = totalSavingsBase.plus(p.currentBalance.toString());

      if (totalSavingsBase.isZero()) {
        throw new BadRequestException('Total savings base is zero; cannot distribute interests');
      }

      // 3. Créer snapshot
      const snapshot = await tx.interestDistributionSnapshot.create({
        data: {
          sessionId: session.id,
          totalInterestPool: totalInterestPool.toFixed(2),
          totalSavingsBase: totalSavingsBase.toFixed(2),
          executedById: actorId,
        },
      });

      // 4. Allouer à chaque ledger membre
      for (const ledger of ledgers) {
        const balance = new Decimal(ledger.balance.toString());
        const allocation = balance.div(totalSavingsBase).mul(totalInterestPool).toDecimalPlaces(2);

        if (allocation.isZero()) continue;

        const newBalance = balance.plus(allocation);

        await tx.savingsEntry.create({
          data: {
            ledgerId: ledger.id,
            sessionId: session.id,
            month: session.sessionNumber,
            amount: allocation.toFixed(2),
            type: SavingsEntryType.INTEREST_CREDIT,
            balanceAfter: newBalance.toFixed(2),
          },
        });

        await tx.savingsLedger.update({
          where: { id: ledger.id },
          data: {
            balance: newBalance.toFixed(2),
            totalInterestReceived: {
              increment: Number(allocation.toFixed(2)),
            },
          },
        });

        await tx.interestAllocation.create({
          data: {
            snapshotId: snapshot.id,
            membershipId: ledger.membershipId,
            savingsBalance: balance.toFixed(2),
            allocationAmount: allocation.toFixed(2),
          },
        });
      }

      // 5. Allouer aux PoolParticipants
      for (const participant of poolParticipants) {
        const balance = new Decimal(participant.currentBalance.toString());
        const allocation = balance.div(totalSavingsBase).mul(totalInterestPool).toDecimalPlaces(2);

        if (allocation.isZero()) continue;

        await tx.poolParticipant.update({
          where: { id: participant.id },
          data: {
            currentBalance: balance.plus(allocation).toFixed(2),
            totalInterestReceived: {
              increment: Number(allocation.toFixed(2)),
            },
          },
        });
      }
    };

    // Si un tx externe est fourni (ex : validateAndClose), l'utiliser directement.
    // Sinon, ouvrir une nouvelle transaction autonome (appels manuels à la distribution).
    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(run);
    }
  }
}
