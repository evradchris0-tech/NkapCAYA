import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CassationRepository } from '../repositories/cassation.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { FiscalYearStatus, TransactionType, LoanStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import * as dayjs from 'dayjs';

@Injectable()
export class CassationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cassationRepository: CassationRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findById(id: string) {
    const record = await this.cassationRepository.findById(id);
    if (!record) throw new NotFoundException(`Cassation record ${id} not found`);
    return record;
  }

  async findByFiscalYear(fiscalYearId: string) {
    const record = await this.cassationRepository.findByFiscalYear(fiscalYearId);
    if (!record) throw new NotFoundException(`No cassation record for fiscal year ${fiscalYearId}`);
    return record;
  }

  /**
   * Processus de cassation en 8 étapes — transaction atomique.
   *
   * 1. Vérifier FiscalYear.status === CASSATION
   * 2. Calculer totalInterestPool (THEORETICAL ou ACTUAL)
   * 3. totalSavingsBase = Σ SavingsLedger.balance + Σ PoolParticipant.currentBalance
   * 4. Redistribuer aux membres (proportionnel)
   * 5. Carryover des prêts non remboursés (×1.04)
   * 6. Parts institutionnelles (PoolParticipants)
   * 7. Créer CassationRecord
   * 8. FiscalYear.status = CLOSED + notifications
   */
  async executeCassation(fiscalYearId: string, actorId: string) {
    const fiscalYear = await this.prisma.fiscalYear.findUnique({
      where: { id: fiscalYearId },
      include: { config: true },
    });
    if (!fiscalYear) throw new NotFoundException(`Fiscal year ${fiscalYearId} not found`);
    if (fiscalYear.status !== FiscalYearStatus.CASSATION) {
      throw new ConflictException(
        `Fiscal year is ${fiscalYear.status}, expected CASSATION`,
      );
    }

    const cassationRecord = await this.prisma.$transaction(async (tx) => {
      const config = fiscalYear.config;
      const method = config?.interestPoolMethod ?? 'THEORETICAL';

      // ── Étape C-06 : Créer l'exercice (N+1) immédiatement pour le repo des prêts
      const nextStartYear = dayjs(fiscalYear.startDate).add(1, 'year');
      const nextEndYear = dayjs(fiscalYear.endDate).add(1, 'year');
      const nextLabel = `${nextStartYear.year()}-${nextEndYear.year()}`;
      
      const nextFiscalYear = await tx.fiscalYear.create({
        data: {
          label: nextLabel,
          startDate: nextStartYear.toDate(),
          endDate: nextEndYear.toDate(),
          cassationDate: dayjs(fiscalYear.cassationDate).add(1, 'year').toDate(),
          loanDueDate: dayjs(fiscalYear.loanDueDate).add(1, 'year').toDate(),
          status: FiscalYearStatus.PENDING,
          openedById: actorId, // Set to the admin running cassation
        }
      });

      // ── Étape 2 : totalInterestPool ──────────────────────────────────────────
      let totalInterestPool = new Decimal(0);
      if (method === 'ACTUAL') {
        const entries = await tx.sessionEntry.findMany({
          where: { session: { fiscalYearId }, type: TransactionType.RBT_INTEREST },
        });
        for (const e of entries) totalInterestPool = totalInterestPool.plus(e.amount.toString());
      } else {
        const accruals = await tx.monthlyLoanAccrual.findMany({
          where: { session: { fiscalYearId } },
        });
        for (const a of accruals) totalInterestPool = totalInterestPool.plus(a.interestAccrued.toString());
      }

      // ── Étape 3 : totalSavingsBase ──────────────────────────────────────────
      const ledgers = await tx.savingsLedger.findMany({
        where: { membership: { fiscalYearId, status: 'ACTIVE' } },
        include: { membership: { include: { profile: true } } },
      });

      const poolParticipants = await tx.poolParticipant.findMany({
        where: { fiscalYearId },
      });

      let totalSavingsBase = new Decimal(0);
      for (const l of ledgers) totalSavingsBase = totalSavingsBase.plus(l.balance.toString());
      for (const p of poolParticipants) totalSavingsBase = totalSavingsBase.plus(p.currentBalance.toString());

      // ── Étape 4 : Redistribution aux membres ────────────────────────────────
      let totalSavingsReturned = new Decimal(0);
      let totalInterestReturned = new Decimal(0);

      // Créer d'abord le CassationRecord (placeholder) pour avoir l'ID
      const cassation = await this.cassationRepository.create(
        {
          fiscalYearId,
          executedById: actorId,
          totalSavingsReturned: '0',
          totalInterestReturned: '0',
          totalDistributed: '0',
          memberCount: ledgers.length,
        },
        tx,
      );

      for (const ledger of ledgers) {
        const savingsBalance = new Decimal(ledger.balance.toString());

        let interestAllocation = new Decimal(0);
        if (!totalSavingsBase.isZero() && !totalInterestPool.isZero()) {
          interestAllocation = savingsBalance
            .div(totalSavingsBase)
            .mul(totalInterestPool)
            .toDecimalPlaces(2);
        }

        const totalReturned = savingsBalance.plus(interestAllocation);

        totalSavingsReturned = totalSavingsReturned.plus(savingsBalance);
        totalInterestReturned = totalInterestReturned.plus(interestAllocation);

        await this.cassationRepository.createRedistribution(
          {
            cassationId: cassation.id,
            membershipId: ledger.membershipId,
            savingsAmount: savingsBalance.toFixed(2),
            interestAmount: interestAllocation.toFixed(2),
            totalReturned: totalReturned.toFixed(2),
          },
          tx,
        );

        // Vider le ledger (solde distribué)
        await tx.savingsLedger.update({
          where: { id: ledger.id },
          data: { balance: '0' },
        });
      }

      // ── Étape 5 : Carryover des prêts non remboursés (LOAN-02 : ×1.04) ──────
      const openLoans = await tx.loanAccount.findMany({
        where: {
          fiscalYearId,
          status: { in: [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_REPAID] },
        },
      });

      for (const loan of openLoans) {
        const carryover = new Decimal(loan.outstandingBalance.toString())
          .mul('1.04')
          .toDecimalPlaces(2);



        await tx.carryoverLoanRecord.create({
          data: {
            originalLoanId: loan.id,
            newFiscalYearId: nextFiscalYear.id, // (C-05) : porté sur le nouvel exercice
            carryoverAmount: carryover.toFixed(2),
            approvedById: actorId,
          },
        });
      }

      // ── Étape 6 : Parts institutionnelles (PoolParticipants) ─────────────────
      for (const participant of poolParticipants) {
        const balance = new Decimal(participant.currentBalance.toString());
        const totalInterest = new Decimal(participant.totalInterestReceived.toString());

        await this.cassationRepository.createPoolParticipantShare(
          {
            cassationId: cassation.id,
            participantId: participant.id,
            participantType: participant.type,
            principalAmount: balance.minus(totalInterest).toFixed(2),
            interestEarned: totalInterest.toFixed(2),
            totalDistributed: balance.toFixed(2),
          },
          tx,
        );

        await tx.poolParticipant.update({
          where: { id: participant.id },
          data: { currentBalance: '0' },
        });
      }

      const totalDistributed = totalSavingsReturned.plus(totalInterestReturned);

      // ── Étape 7 : Mettre à jour le CassationRecord avec les totaux ───────────
      const finalRecord = await tx.cassationRecord.update({
        where: { id: cassation.id },
        data: {
          totalSavingsReturned: totalSavingsReturned.toFixed(2),
          totalInterestReturned: totalInterestReturned.toFixed(2),
          totalDistributed: totalDistributed.toFixed(2),
          carryoverCount: openLoans.length, // (M-05)
        },
      });

      // ── Étape 8 : FiscalYear → CLOSED ────────────────────────────────────────
      await tx.fiscalYear.update({
        where: { id: fiscalYearId },
        data: { status: FiscalYearStatus.CLOSED },
      });

      return finalRecord;
    });

    // ── Notifications (fire-and-forget — non bloquant) ────────────────────────
    this.sendCassationNotifications(fiscalYearId, actorId).catch(() => {
      // Ignorer les erreurs de notification
    });

    return cassationRecord;
  }

  private async sendCassationNotifications(fiscalYearId: string, actorId: string) {
    const bureauUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['PRESIDENT', 'TRESORIER', 'SECRETAIRE_GENERAL'] as any },
        isActive: true,
      },
    });

    const message = `CAYA — La cassation de l'exercice a été exécutée avec succès. Les redistribution sont disponibles dans l'application.`;

    for (const user of bureauUsers) {
      await this.notificationsService.sendSMS(user.phone, message);
    }
  }
}
