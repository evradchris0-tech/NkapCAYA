import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CassationRepository } from '../repositories/cassation.repository';

@Injectable()
export class CassationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cassationRepository: CassationRepository,
  ) {}

  async executeCassation(fiscalYearId: string) {
    throw new Error('Not implemented');
  }

  async generateRedistributions(cassationRecordId: string) {
    throw new Error('Not implemented');
  }

  async findById(id: string) {
    throw new Error('Not implemented');
  }
}
