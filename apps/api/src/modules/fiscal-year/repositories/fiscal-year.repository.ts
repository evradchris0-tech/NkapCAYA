import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FiscalYearRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    throw new Error('Not implemented');
  }

  async findById(id: string) {
    throw new Error('Not implemented');
  }

  async findActive() {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: string) {
    throw new Error('Not implemented');
  }

  async findMemberships(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async createMembership(data: any) {
    throw new Error('Not implemented');
  }

  async createShareCommitment(data: any) {
    throw new Error('Not implemented');
  }
}
