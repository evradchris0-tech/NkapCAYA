import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ReportsRepository } from '../repositories/reports.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async generateAnnualSummary(_fiscalYearId: string, _format?: string) {
    throw new Error('Not implemented');
  }

  async generateMemberReport(_memberId: string, _fiscalYearId?: string, _format?: string) {
    throw new Error('Not implemented');
  }

  async generateSessionReport(_sessionId: string, _format?: string) {
    throw new Error('Not implemented');
  }

  async exportPDF(_data: unknown, _template: string): Promise<Buffer> {
    throw new Error('Not implemented');
  }

  async exportExcel(_data: unknown, _sheetName: string): Promise<Buffer> {
    throw new Error('Not implemented');
  }
}
