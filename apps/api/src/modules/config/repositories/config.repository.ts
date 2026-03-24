import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, RescueEventType } from '@prisma/client';

@Injectable()
export class ConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTontineConfig() {
    return this.prisma.tontineConfig.findUnique({ where: { id: 'caya' } });
  }

  updateTontineConfig(data: Prisma.TontineConfigUpdateInput) {
    return this.prisma.tontineConfig.upsert({
      where: { id: 'caya' },
      create: { id: 'caya', ...(data as any) },
      update: data,
    });
  }

  findFiscalYearConfig(fiscalYearId: string) {
    return this.prisma.fiscalYearConfig.findUnique({ where: { fiscalYearId } });
  }

  createFiscalYearConfig(
    data: Prisma.FiscalYearConfigUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.fiscalYearConfig.create({ data });
  }

  findRescueEventAmounts() {
    return this.prisma.rescueEventAmount.findMany({ orderBy: { eventType: 'asc' } });
  }

  findRescueEventAmount(eventType: RescueEventType) {
    return this.prisma.rescueEventAmount.findUnique({ where: { eventType } });
  }

  updateRescueEventAmount(eventType: RescueEventType, amount: number, actorId: string) {
    return this.prisma.rescueEventAmount.upsert({
      where: { eventType },
      create: { eventType, amount, label: eventType.replace(/_/g, ' '), updatedById: actorId },
      update: { amount, updatedById: actorId },
    });
  }

  countActiveFiscalYears() {
    return this.prisma.fiscalYear.count({ where: { status: 'ACTIVE' } });
  }
}
