import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    throw new Error('Not implemented');
  }

  async findByFiscalYear(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: string) {
    throw new Error('Not implemented');
  }

  async createEntry(data: any) {
    throw new Error('Not implemented');
  }

  async findEntries(sessionId: string) {
    throw new Error('Not implemented');
  }

  async createTransactionSequence(data: any) {
    throw new Error('Not implemented');
  }

  async getNextSequenceNumber(sessionId: string): Promise<number> {
    throw new Error('Not implemented');
  }
}
