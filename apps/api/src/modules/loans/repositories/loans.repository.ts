import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, LoanStatus } from '@prisma/client';

@Injectable()
export class LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LoanAccountUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.loanAccount.create({ data });
  }

  findById(id: string) {
    return this.prisma.loanAccount.findUnique({
      where: { id },
      include: {
        monthlyAccruals: { orderBy: { month: 'asc' } },
        repayments: { orderBy: { recordedAt: 'asc' } },
        membership: { include: { profile: true } },
      },
    });
  }

  findByFiscalYear(fiscalYearId: string) {
    return this.prisma.loanAccount.findMany({
      where: { fiscalYearId },
      include: { membership: { include: { profile: true } } },
      orderBy: { requestedAt: 'asc' },
    });
  }

  findByMembership(membershipId: string) {
    return this.prisma.loanAccount.findMany({
      where: { membershipId },
      orderBy: { requestedAt: 'asc' },
    });
  }

  countActiveLoans(membershipId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.loanAccount.count({
      where: { membershipId, status: { in: [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_REPAID] } },
    });
  }

  updateStatus(
    id: string,
    status: LoanStatus,
    extra?: Partial<{ disbursedAt: Date; disbursedById: string }>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.loanAccount.update({ where: { id }, data: { status, ...extra } });
  }

  updateBalance(
    id: string,
    data: Prisma.LoanAccountUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.loanAccount.update({ where: { id }, data });
  }

  createRepayment(data: Prisma.LoanRepaymentUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.loanRepayment.create({ data });
  }

  createMonthlyAccrual(
    data: Prisma.MonthlyLoanAccrualUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.monthlyLoanAccrual.create({ data });
  }

  findLatestAccrual(loanId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.monthlyLoanAccrual.findFirst({
      where: { loanId },
      orderBy: { month: 'desc' },
    });
  }

  findAccrualBySession(loanId: string, sessionId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.monthlyLoanAccrual.findUnique({
      where: { loanId_sessionId: { loanId, sessionId } },
    });
  }

  updateAccrual(
    id: string,
    data: Prisma.MonthlyLoanAccrualUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.monthlyLoanAccrual.update({ where: { id }, data });
  }

  findActiveLoansForFiscalYear(fiscalYearId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.loanAccount.findMany({
      where: {
        fiscalYearId,
        status: { in: [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_REPAID] },
      },
      orderBy: { requestedAt: 'asc' },
    });
  }

  createCarryoverRecord(
    data: Prisma.CarryoverLoanRecordUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.carryoverLoanRecord.create({ data });
  }
}
