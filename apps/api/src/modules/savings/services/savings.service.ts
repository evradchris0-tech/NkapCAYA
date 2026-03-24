import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { SavingsRepository } from '../repositories/savings.repository';
import { TransactionType, SavingsEntryType } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class SavingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly savingsRepository: SavingsRepository,
  ) {}

  async getBalance(membershipId: string) {
    const ledger = await this.savingsRepository.findLedgerByMembership(membershipId);
    if (!ledger) throw new NotFoundException(`Savings ledger not found for membership ${membershipId}`);
    return ledger;
  }

  async getFiscalYearBalances(fiscalYearId: string) {
    return this.savingsRepository.findLedgersByFiscalYear(fiscalYearId);
  }

  /**
   * Distribute session interest pool proportionally among all active savings ledgers.
   * Called by SessionsService.validateAndClose().
   */
  async distributeInterests(sessionId: string, actorId: string) {
    const session = await this.prisma.monthlySession.findUnique({
      where: { id: sessionId },
      include: { fiscalYear: { include: { config: true } } },
    });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const method = session.fiscalYear.config?.interestPoolMethod ?? 'THEORETICAL';

    await this.prisma.$transaction(async (tx) => {
      // 1. Calculer totalInterestPool
      let totalInterestPool = new Decimal(0);

      if (method === 'ACTUAL') {
        const rbtEntries = await tx.sessionEntry.findMany({
          where: { sessionId, type: TransactionType.RBT_INTEREST },
        });
        for (const e of rbtEntries) {
          totalInterestPool = totalInterestPool.plus(e.amount.toString());
        }
      } else {
        const accruals = await tx.monthlyLoanAccrual.findMany({
          where: { sessionId },
        });
        for (const a of accruals) {
          totalInterestPool = totalInterestPool.plus(a.interestAccrued.toString());
        }
      }

      if (totalInterestPool.isZero()) return;

      // 2. Récupérer tous les ledgers actifs
      const ledgers = await tx.savingsLedger.findMany({
        where: { membership: { fiscalYearId: session.fiscalYearId, status: 'ACTIVE' } },
      });

      const poolParticipants = await tx.poolParticipant.findMany({
        where: { fiscalYearId: session.fiscalYearId },
      });

      let totalSavingsBase = new Decimal(0);
      for (const l of ledgers) totalSavingsBase = totalSavingsBase.plus(l.balance.toString());
      for (const p of poolParticipants) totalSavingsBase = totalSavingsBase.plus(p.currentBalance.toString());

      if (totalSavingsBase.isZero()) {
        throw new BadRequestException('Total savings base is zero; cannot distribute interests');
      }

      // 3. Snapshot
      const snapshot = await tx.interestDistributionSnapshot.create({
        data: {
          sessionId,
          totalInterestPool: totalInterestPool.toFixed(2),
          totalSavingsBase: totalSavingsBase.toFixed(2),
          executedById: actorId,
        },
      });

      // 4. Distribuer aux membres
      for (const ledger of ledgers) {
        const balance = new Decimal(ledger.balance.toString());
        const allocation = balance.div(totalSavingsBase).mul(totalInterestPool).toDecimalPlaces(2);
        if (allocation.isZero()) continue;

        const newBalance = balance.plus(allocation);

        await tx.savingsEntry.create({
          data: {
            ledgerId: ledger.id,
            sessionId,
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
            totalInterestReceived: { increment: Number(allocation.toFixed(2)) },
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

      // 5. Distribuer aux pool participants
      for (const participant of poolParticipants) {
        const balance = new Decimal(participant.currentBalance.toString());
        const allocation = balance.div(totalSavingsBase).mul(totalInterestPool).toDecimalPlaces(2);
        if (allocation.isZero()) continue;

        await tx.poolParticipant.update({
          where: { id: participant.id },
          data: {
            currentBalance: balance.plus(allocation).toFixed(2),
            totalInterestReceived: { increment: Number(allocation.toFixed(2)) },
          },
        });
      }
    });

    return this.savingsRepository.findInterestSnapshot(sessionId);
  }
}
