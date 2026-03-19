import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import { RecordEntriesDto } from '../dto/record-entries.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async openSession(sessionId: string) {
    throw new Error('Not implemented');
  }

  async recordEntries(sessionId: string, dto: RecordEntriesDto) {
    throw new Error('Not implemented');
  }

  async closeSession(sessionId: string) {
    throw new Error('Not implemented');
  }

  async generateReference(sessionId: string, membershipId: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
