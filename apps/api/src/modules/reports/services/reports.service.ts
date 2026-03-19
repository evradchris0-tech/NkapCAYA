import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ReportsRepository } from '../repositories/reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async generateAnnualSummary(fiscalYearId: string, format?: string) {
    throw new Error('Not implemented');
  }

  async generateMemberReport(memberId: string, fiscalYearId?: string, format?: string) {
    throw new Error('Not implemented');
  }

  async generateSessionReport(sessionId: string, format?: string) {
    throw new Error('Not implemented');
  }

  async exportPDF(data: any, template: string): Promise<Buffer> {
    throw new Error('Not implemented');
  }

  async exportExcel(data: any, sheetName: string): Promise<Buffer> {
    throw new Error('Not implemented');
  }
}
