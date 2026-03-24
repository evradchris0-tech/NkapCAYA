import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, SessionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.monthlySession.findUnique({
      where: { id },
      include: {
        fiscalYear: { include: { config: true } },
        entries: { orderBy: { recordedAt: 'asc' } },
      },
    });
  }

  findByFiscalYear(fiscalYearId: string) {
    return this.prisma.monthlySession.findMany({
      where: { fiscalYearId },
      orderBy: { sessionNumber: 'asc' },
    });
  }

  findPreviousSession(fiscalYearId: string, sessionNumber: number) {
    if (sessionNumber <= 1) return Promise.resolve(null);
    return this.prisma.monthlySession.findUnique({
      where: { fiscalYearId_sessionNumber: { fiscalYearId, sessionNumber: sessionNumber - 1 } },
    });
  }

  updateStatus(
    id: string,
    status: SessionStatus,
    extra?: Partial<{ openedAt: Date; openedById: string; closedAt: Date; closedById: string }>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.monthlySession.update({ where: { id }, data: { status, ...extra } });
  }

  createEntry(data: Prisma.SessionEntryUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.sessionEntry.create({ data });
  }

  findEntries(sessionId: string) {
    return this.prisma.sessionEntry.findMany({
      where: { sessionId },
      orderBy: { recordedAt: 'asc' },
    });
  }

  /** Count existing entries of same type in the same fiscal year for reference numbering */
  countEntriesByType(
    fiscalYearId: string,
    type: TransactionType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.sessionEntry.count({
      where: { type, session: { fiscalYearId } },
    });
  }

  incrementSessionTotal(
    id: string,
    field: string,
    amount: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.monthlySession.update({
      where: { id },
      data: { [field]: { increment: amount } },
    });
  }
}
