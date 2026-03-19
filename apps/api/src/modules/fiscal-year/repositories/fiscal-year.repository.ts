import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class FiscalYearRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findById(_id: string) {
    throw new Error('Not implemented');
  }

  async findActive() {
    throw new Error('Not implemented');
  }

  async updateStatus(_id: string, _status: string) {
    throw new Error('Not implemented');
  }

  async findMemberships(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async createMembership(_data: unknown) {
    throw new Error('Not implemented');
  }

  async createShareCommitment(_data: unknown) {
    throw new Error('Not implemented');
  }
}
