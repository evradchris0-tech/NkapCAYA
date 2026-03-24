import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CassationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CassationRecordUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.cassationRecord.create({ data });
  }

  findById(id: string) {
    return this.prisma.cassationRecord.findUnique({
      where: { id },
      include: {
        redistributions: { include: { membership: { include: { profile: true } } } },
        participantShares: true,
      },
    });
  }

  findByFiscalYear(fiscalYearId: string) {
    return this.prisma.cassationRecord.findUnique({
      where: { fiscalYearId },
      include: {
        redistributions: { include: { membership: { include: { profile: true } } } },
        participantShares: true,
      },
    });
  }

  createRedistribution(
    data: Prisma.CassationRedistributionUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.cassationRedistribution.create({ data });
  }

  createPoolParticipantShare(
    data: Prisma.PoolParticipantCassationShareUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.poolParticipantCassationShare.create({ data });
  }
}
