import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFullFiscalYearData(fiscalYearId: string) {
    const [fiscalYear, memberships, sessions, savingsLedgers, loans, poolParticipants] =
      await Promise.all([
        this.prisma.fiscalYear.findUniqueOrThrow({
          where: { id: fiscalYearId },
          include: { config: true },
        }),
        this.prisma.membership.findMany({
          where: { fiscalYearId, deletedAt: null },
          include: { profile: true, shareCommitment: true },
          orderBy: { profile: { lastName: 'asc' } },
        }),
        this.prisma.monthlySession.findMany({
          where: { fiscalYearId },
          include: {
            entries: {
              where: { deletedAt: null },
              include: { membership: { include: { profile: true } } },
            },
            interestDistribution: { include: { allocations: true } },
          },
          orderBy: { sessionNumber: 'asc' },
        }),
        this.prisma.savingsLedger.findMany({
          where: { membership: { fiscalYearId, deletedAt: null } },
          include: {
            entries: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
            membership: { include: { profile: true } },
          },
        }),
        this.prisma.loanAccount.findMany({
          where: { fiscalYearId },
          include: {
            monthlyAccruals: { orderBy: { month: 'asc' } },
            repayments: { where: { deletedAt: null }, orderBy: { recordedAt: 'asc' } },
            membership: { include: { profile: true } },
          },
        }),
        this.prisma.poolParticipant.findMany({
          where: { fiscalYearId, deletedAt: null },
        }),
      ]);

    return { fiscalYear, memberships, sessions, savingsLedgers, loans, poolParticipants };
  }

  async getMemberReportData(_memberId: string, _fiscalYearId?: string) {
    throw new Error('Not implemented');
  }

  async getSessionReportData(_sessionId: string) {
    throw new Error('Not implemented');
  }
}
