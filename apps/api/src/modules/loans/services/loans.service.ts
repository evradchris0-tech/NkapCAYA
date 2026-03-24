import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { LoansRepository } from '../repositories/loans.repository';
import { RequestLoanDto } from '../dto/request-loan.dto';
import { ApplyRepaymentDto } from '../dto/apply-repayment.dto';
import { LoanStatus, Prisma, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';
import * as dayjs from 'dayjs';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loansRepository: LoansRepository,
  ) {}

  async requestLoan(dto: RequestLoanDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: dto.membershipId },
        include: {
          fiscalYear: { include: { config: true } },
          savingsLedger: true,
        },
      });
      if (!membership) throw new NotFoundException(`Membership ${dto.membershipId} not found`);

      const config = membership.fiscalYear.config;
      if (!config) {
        throw new BadRequestException('Fiscal year is not yet activated (no config snapshot)');
      }

      const tontineConfig = await tx.tontineConfig.findUnique({ where: { id: 'caya' } });
      if (!tontineConfig) {
        throw new BadRequestException('Tontine configuration not found');
      }

      const savingsBalance = new Decimal(membership.savingsLedger?.balance?.toString() ?? '0');
      const amount = new Decimal(dto.amount);
      const dueBeforeDate = dayjs(dto.dueBeforeDate);
      const cassationDate = dayjs(membership.fiscalYear.cassationDate);

      // Spec 1 : épargne >= minSavingsToLoan
      if (savingsBalance.lessThan(config.minSavingsToLoan.toString())) {
        throw new BadRequestException(
          `Savings ${savingsBalance} < minimum ${config.minSavingsToLoan} required to borrow`,
        );
      }

      // Spec (C-04) : amount ∈ [minLoanAmount, maxLoanAmount]
      if (amount.lessThan(tontineConfig.minLoanAmount.toString()) || amount.greaterThan(tontineConfig.maxLoanAmount.toString())) {
        throw new BadRequestException(
          `Loan amount ${amount} must be between the configured minimum ${tontineConfig.minLoanAmount} and maximum ${tontineConfig.maxLoanAmount}`,
        );
      }
      
      // Spec 2 : amount <= savings × maxLoanMultiplier
      if (amount.greaterThan(savingsBalance.mul(config.maxLoanMultiplier))) {
        throw new BadRequestException(
          `Amount exceeds maximum allowed (savings × ${config.maxLoanMultiplier})`,
        );
      }
      // Spec 3 : dueBeforeDate < cassationDate
      if (!dueBeforeDate.isBefore(cassationDate)) {
        throw new BadRequestException('Loan due date must be before fiscal year cassation date');
      }
      // Spec 4 : activeLoansCount < maxConcurrentLoans
      const activeCount = await this.loansRepository.countActiveLoans(dto.membershipId, tx);
      if (activeCount >= config.maxConcurrentLoans) {
        throw new ConflictException(
          `Member already has ${activeCount} active loan(s); max is ${config.maxConcurrentLoans}`,
        );
      }

      return this.loansRepository.create(
        {
          membershipId: dto.membershipId,
          fiscalYearId: membership.fiscalYearId,
          principalAmount: amount.toFixed(2),
          monthlyRate: config.loanMonthlyRate.toString(),
          dueBeforeDate: dueBeforeDate.toDate(),
          outstandingBalance: amount.toFixed(2),
          requestNotes: dto.requestNotes ?? null,
        },
        tx,
      );
    });
  }

  /** PENDING → ACTIVE (approve + disburse) */
  async approveLoan(loanId: string, actorId: string) {
    const loan = await this.loansRepository.findById(loanId);
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    if (loan.status !== LoanStatus.PENDING) {
      throw new ConflictException(`Loan is ${loan.status}, expected PENDING`);
    }

    return this.loansRepository.updateStatus(loanId, LoanStatus.ACTIVE, {
      disbursedAt: new Date(),
      disbursedById: actorId,
    });
  }

  async getMemberLoans(membershipId: string) {
    return this.loansRepository.findByMembership(membershipId);
  }

  async getLoan(loanId: string) {
    const loan = await this.loansRepository.findById(loanId);
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
    return loan;
  }

  async getFiscalYearLoans(fiscalYearId: string) {
    return this.loansRepository.findByFiscalYear(fiscalYearId);
  }

  /**
   * Calculer l'intérêt mensuel pour un prêt : interestAccrued = balance × monthlyRate.
   * Peut être appelé dans une transaction parente (tx).
   */
  async computeMonthlyAccrual(
    loanId: string,
    sessionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client: Prisma.TransactionClient = tx ?? (this.prisma as unknown as Prisma.TransactionClient);
    const loan = await client.loanAccount.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

    const activeStatuses: LoanStatus[] = [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_REPAID];
    if (!activeStatuses.includes(loan.status)) return null;

    const balance = new Decimal(loan.outstandingBalance.toString());
    const rate = new Decimal(loan.monthlyRate.toString());
    const interestAccrued = balance.mul(rate).toDecimalPlaces(2);
    const balanceWithInterest = balance.plus(interestAccrued);

    const session = await client.monthlySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Session ${sessionId} not found`);

    const accrual = await client.monthlyLoanAccrual.create({
      data: {
        loanId,
        sessionId,
        month: session.sessionNumber,
        balanceAtMonthStart: balance.toFixed(2),
        interestAccrued: interestAccrued.toFixed(2),
        balanceWithInterest: balanceWithInterest.toFixed(2),
        repaymentReceived: '0',
        balanceAtMonthEnd: balanceWithInterest.toFixed(2),
      },
    });

    await client.loanAccount.update({
      where: { id: loanId },
      data: { totalInterestAccrued: { increment: Number(interestAccrued.toFixed(2)) } },
    });

    return accrual;
  }

  /** Calculer les accruals pour TOUS les prêts actifs d'un exercice (à l'ouverture de session). */
  async computeAccrualsForSession(fiscalYearId: string, sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const activeLoans = await this.loansRepository.findActiveLoansForFiscalYear(fiscalYearId, tx);
      const results: any[] = [];
      for (const loan of activeLoans) {
        const accrual = await this.computeMonthlyAccrual(loan.id, sessionId, tx);
        if (accrual) results.push(accrual);
      }
      return results;
    });
  }

  /**
   * Appliquer un remboursement : décompose amount → interestPart + principalPart.
   * LOAN-01 : intérêts payés en premier (FIFO).
   * LOAN-03 : balance = 0 → status CLOSED.
   * LOAN-04 : amount < interestDue → shortfall reste capitalisé dans balance.
   */
  async applyRepayment(loanId: string, dto: ApplyRepaymentDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loanAccount.findUnique({ where: { id: loanId } });
      if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);

      const activeStatuses: string[] = [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_REPAID];
      if (!activeStatuses.includes(loan.status as string)) {
        throw new ConflictException(`Loan ${loanId} is ${loan.status}; cannot apply repayment`);
      }

      const latestAccrual = await this.loansRepository.findLatestAccrual(loanId, tx);
      const interestDue = latestAccrual
        ? new Decimal(latestAccrual.interestAccrued.toString())
        : new Decimal(0);

      const totalAmount = new Decimal(dto.amount);
      const interestPart = Decimal.min(totalAmount, interestDue);
      const principalPart = totalAmount.minus(interestPart);
      const outstandingBalance = new Decimal(loan.outstandingBalance.toString());
      const newBalance = outstandingBalance.minus(principalPart).toDecimalPlaces(2);
      const balanceAfter = newBalance.isNegative() ? new Decimal(0) : newBalance;
      const newTotalRepaid = new Decimal(loan.totalRepaid.toString()).plus(totalAmount);

      let newStatus: LoanStatus;
      if (balanceAfter.isZero()) {
        newStatus = LoanStatus.CLOSED;
      } else {
        newStatus = LoanStatus.PARTIALLY_REPAID;
      }

      await this.loansRepository.updateBalance(
        loanId,
        {
          outstandingBalance: balanceAfter.toFixed(2),
          totalRepaid: newTotalRepaid.toFixed(2),
          status: newStatus,
        },
        tx,
      );

      if (latestAccrual) {
        await this.loansRepository.updateAccrual(
          latestAccrual.id,
          {
            repaymentReceived: { increment: Number(totalAmount.toFixed(2)) },
            balanceAtMonthEnd: balanceAfter.toFixed(2),
          },
          tx,
        );
      }

      const repayment = await this.loansRepository.createRepayment(
        {
          loanId,
          sessionId: dto.sessionId ?? '',
          amount: totalAmount.toFixed(2),
          principalPart: principalPart.toFixed(2),
          interestPart: interestPart.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
        },
        tx,
      );

      // C-02 : Créer obligatoirement jusqu'à 2 SessionEntries (RBT_INTEREST et RBT_PRINCIPAL)
      const isOutOfSession = !dto.sessionId;
      
      let refYear = dayjs().format('YYYY');
      let refMonth = dayjs().format('MM');
      let fiscalYearId = loan.fiscalYearId;
      let sessionNumber = 0; // Default out-of-session

      const session = dto.sessionId ? await tx.monthlySession.findUnique({
        where: { id: dto.sessionId },
        include: { fiscalYear: true }
      }) : null;

      if (session) {
        const sessionDate = dayjs(session.fiscalYear.startDate).add(session.sessionNumber - 1, 'month');
        refYear = sessionDate.format('YYYY');
        refMonth = sessionDate.format('MM');
        sessionNumber = session.sessionNumber;
        fiscalYearId = session.fiscalYearId;
      }

      const createAtomicEntry = async (type: TransactionType, shortType: string, val: Decimal) => {
        if (val.lessThanOrEqualTo(0)) return;
        
        // C-04 : Génération atomique de la référence avec TransactionSequence
        const seq = await tx.transactionSequence.upsert({
          where: { fiscalYearId_sessionNumber_txType: { fiscalYearId, sessionNumber, txType: type } },
          create: { fiscalYearId, sessionNumber, txType: type, lastSequence: 1 },
          update: { lastSequence: { increment: 1 } }
        });
        
        const ref = `CAYA-${refYear}-${refMonth}-${shortType}-${String(seq.lastSequence).padStart(4, '0')}`;

        const entry = await tx.sessionEntry.create({
          data: {
            reference: ref,
            sessionId: dto.sessionId || null,
            membershipId: loan.membershipId,
            type: type,
            amount: val.toFixed(2),
            loanId: loan.id,
            isOutOfSession: isOutOfSession,
            recordedById: actorId,
          }
        });

        // Mise à jour de la foreign key LoanRepayment.sessionEntryId (sur le dernier entry, généralement RBT_PRINCIPAL)
        await tx.loanRepayment.update({
          where: { id: repayment.id },
          data: { sessionEntryId: entry.id }
        });

        if (session) {
          const field = type === TransactionType.RBT_INTEREST ? 'totalRbtInterest' : 'totalRbtPrincipal';
          await tx.monthlySession.update({
            where: { id: session.id },
            data: { [field]: { increment: Number(val.toFixed(2)) } }
          });
        }
      };

      await createAtomicEntry(TransactionType.RBT_INTEREST, 'RBTI', interestPart);
      await createAtomicEntry(TransactionType.RBT_PRINCIPAL, 'RBTP', principalPart);

      return repayment;
    });
  }
}
