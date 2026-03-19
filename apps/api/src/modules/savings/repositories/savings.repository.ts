import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class SavingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLedgerByMembership(membershipId: string) {
    throw new Error('Not implemented');
  }

  async createEntry(data: any) {
    throw new Error('Not implemented');
  }

  async findEntriesByMembership(membershipId: string) {
    throw new Error('Not implemented');
  }

  async findPoolParticipants(sessionId: string) {
    throw new Error('Not implemented');
  }

  async createInterestSnapshot(data: any) {
    throw new Error('Not implemented');
  }

  async createInterestAllocation(data: any) {
    throw new Error('Not implemented');
  }

  async updateLedgerBalance(membershipId: string, delta: number) {
    throw new Error('Not implemented');
  }
}
