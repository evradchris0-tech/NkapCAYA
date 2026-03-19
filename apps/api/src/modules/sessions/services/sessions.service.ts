import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import { RecordEntriesDto } from '../dto/record-entries.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async openSession(_sessionId: string) {
    throw new Error('Not implemented');
  }

  async recordEntries(_sessionId: string, _dto: RecordEntriesDto) {
    throw new Error('Not implemented');
  }

  async closeSession(_sessionId: string) {
    throw new Error('Not implemented');
  }

  async generateReference(_sessionId: string, _membershipId: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
