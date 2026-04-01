import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SavingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLedgerByMembership(membershipId: string) {
    return this.prisma.savingsLedger.findUnique({
      where: { membershipId },
      include: {
        entries: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  findLedgersByFiscalYear(fiscalYearId: string) {
    return this.prisma.savingsLedger.findMany({
      where: { membership: { fiscalYearId } },
      include: { membership: { include: { profile: true } } },
      orderBy: { membership: { profile: { lastName: 'asc' } } },
    });
  }

  createEntry(data: Prisma.SavingsEntryUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.savingsEntry.create({ data });
  }

  updateLedgerBalance(
    membershipId: string,
    data: Prisma.SavingsLedgerUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.savingsLedger.update({ where: { membershipId }, data });
  }

  findPoolParticipants(fiscalYearId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.poolParticipant.findMany({ where: { fiscalYearId } });
  }

  createInterestSnapshot(
    data: Prisma.InterestDistributionSnapshotUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.interestDistributionSnapshot.create({ data });
  }

  findInterestSnapshot(sessionId: string) {
    return this.prisma.interestDistributionSnapshot.findUnique({
      where: { sessionId },
      include: { allocations: true },
    });
  }

  createInterestAllocation(
    data: Prisma.InterestAllocationUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.interestAllocation.create({ data });
  }
}
