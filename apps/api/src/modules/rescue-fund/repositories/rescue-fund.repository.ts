import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class RescueFundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGlobalLedger() {
    throw new Error('Not implemented');
  }

  async createEvent(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findEvents(_fiscalYearId?: string) {
    throw new Error('Not implemented');
  }

  async findPositionByMembership(_membershipId: string) {
    throw new Error('Not implemented');
  }

  async upsertPosition(_data: unknown) {
    throw new Error('Not implemented');
  }

  async updateLedgerBalance(_delta: number) {
    throw new Error('Not implemented');
  }
}
