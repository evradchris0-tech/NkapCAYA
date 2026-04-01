import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, RescueEventType } from '@prisma/client';

@Injectable()
export class RescueFundRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLedgerByFiscalYear(fiscalYearId: string) {
    return this.prisma.rescueFundLedger.findUnique({
      where: { fiscalYearId },
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        positions: { include: { membership: { include: { profile: true } } } },
      },
    });
  }

  findEventsByFiscalYear(fiscalYearId: string) {
    return this.prisma.rescueFundEvent.findMany({
      where: { ledger: { fiscalYearId } },
      orderBy: { eventDate: 'desc' },
    });
  }

  findRescueEventAmount(eventType: RescueEventType) {
    return this.prisma.rescueEventAmount.findUnique({ where: { eventType } });
  }

  findPositionByMembership(membershipId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.rescueFundPosition.findUnique({ where: { membershipId } });
  }

  createEvent(data: Prisma.RescueFundEventUncheckedCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.rescueFundEvent.create({ data });
  }

  updateLedger(
    fiscalYearId: string,
    data: Prisma.RescueFundLedgerUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.rescueFundLedger.update({ where: { fiscalYearId }, data });
  }

  updatePosition(
    membershipId: string,
    data: Prisma.RescueFundPositionUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.rescueFundPosition.update({ where: { membershipId }, data });
  }
}
