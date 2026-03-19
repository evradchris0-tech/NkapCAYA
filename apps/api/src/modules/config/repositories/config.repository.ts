import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTontineConfig() {
    throw new Error('Not implemented');
  }

  async upsertTontineConfig(data: any) {
    throw new Error('Not implemented');
  }

  async findFiscalYearConfig(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async createFiscalYearConfig(data: any) {
    throw new Error('Not implemented');
  }

  async findRescueEventAmounts() {
    throw new Error('Not implemented');
  }
}
