import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class RescueFundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGlobalLedger() {
    throw new Error('Not implemented');
  }

  async createEvent(data: any) {
    throw new Error('Not implemented');
  }

  async findEvents(fiscalYearId?: string) {
    throw new Error('Not implemented');
  }

  async findPositionByMembership(membershipId: string) {
    throw new Error('Not implemented');
  }

  async upsertPosition(data: any) {
    throw new Error('Not implemented');
  }

  async updateLedgerBalance(delta: number) {
    throw new Error('Not implemented');
  }
}
