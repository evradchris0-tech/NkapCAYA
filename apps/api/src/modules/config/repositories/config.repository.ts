import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class ConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTontineConfig() {
    throw new Error('Not implemented');
  }

  async upsertTontineConfig(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findFiscalYearConfig(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async createFiscalYearConfig(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findRescueEventAmounts() {
    throw new Error('Not implemented');
  }
}
