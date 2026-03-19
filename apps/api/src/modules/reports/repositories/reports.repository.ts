import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAnnualSummaryData(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async getMemberReportData(_memberId: string, _fiscalYearId?: string) {
    throw new Error('Not implemented');
  }

  async getSessionReportData(_sessionId: string) {
    throw new Error('Not implemented');
  }

  async getSavingsSummary(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async getLoansSummary(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async getRescueFundSummary(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }
}
