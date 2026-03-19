import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CassationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    throw new Error('Not implemented');
  }

  async findById(id: string) {
    throw new Error('Not implemented');
  }

  async findByFiscalYear(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async createRedistribution(data: any) {
    throw new Error('Not implemented');
  }

  async findRedistributions(cassationRecordId: string) {
    throw new Error('Not implemented');
  }

  async createPoolParticipantShare(data: any) {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: string) {
    throw new Error('Not implemented');
  }
}
