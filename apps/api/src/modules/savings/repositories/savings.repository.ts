import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class SavingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLedgerByMembership(_membershipId: string) {
    throw new Error('Not implemented');
  }

  async createEntry(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findEntriesByMembership(_membershipId: string) {
    throw new Error('Not implemented');
  }

  async findPoolParticipants(_sessionId: string) {
    throw new Error('Not implemented');
  }

  async createInterestSnapshot(_data: unknown) {
    throw new Error('Not implemented');
  }

  async createInterestAllocation(_data: unknown) {
    throw new Error('Not implemented');
  }

  async updateLedgerBalance(_membershipId: string, _delta: number) {
    throw new Error('Not implemented');
  }
}
