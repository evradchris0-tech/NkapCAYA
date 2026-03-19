import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAnnualSummaryData(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async getMemberReportData(memberId: string, fiscalYearId?: string) {
    throw new Error('Not implemented');
  }

  async getSessionReportData(sessionId: string) {
    throw new Error('Not implemented');
  }

  async getSavingsSummary(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async getLoansSummary(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async getRescueFundSummary(fiscalYearId: string) {
    throw new Error('Not implemented');
  }
}
