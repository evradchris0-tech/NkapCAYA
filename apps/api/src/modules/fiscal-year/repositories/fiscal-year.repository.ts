import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma, FiscalYearStatus } from '@prisma/client';

@Injectable()
export class FiscalYearRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.FiscalYearUncheckedCreateInput) {
    return this.prisma.fiscalYear.create({ data });
  }

  findAll() {
    return this.prisma.fiscalYear.findMany({
      include: { config: true },
      orderBy: { startDate: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.fiscalYear.findUnique({
      where: { id },
      include: { config: true },
    });
  }

  findActive() {
    return this.prisma.fiscalYear.findFirst({ where: { status: FiscalYearStatus.ACTIVE } });
  }

  findOverlapping(startDate: Date, endDate: Date) {
    return this.prisma.fiscalYear.findFirst({
      where: {
        status: { in: [FiscalYearStatus.PENDING, FiscalYearStatus.ACTIVE] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  }

  updateStatus(
    id: string,
    status: FiscalYearStatus,
    extra?: Partial<{ openedAt: Date; openedById: string; closedAt: Date; closedById: string }>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.fiscalYear.update({ where: { id }, data: { status, ...extra } });
  }

  update(id: string, data: Prisma.FiscalYearUpdateInput) {
    return this.prisma.fiscalYear.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.fiscalYear.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  hasMemberships(fiscalYearId: string) {
    return this.prisma.membership.count({ where: { fiscalYearId } });
  }

  findMemberships(fiscalYearId: string) {
    return this.prisma.membership.findMany({
      where: { fiscalYearId },
      include: {
        profile: {
          select: { id: true, memberCode: true, firstName: true, lastName: true, phone1: true },
        },
        shareCommitment: true,
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  findMembership(fiscalYearId: string, profileId: string) {
    return this.prisma.membership.findUnique({
      where: { profileId_fiscalYearId: { profileId, fiscalYearId } },
    });
  }

  createMembership(
    data: Prisma.MembershipUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.membership.create({ data });
  }

  createShareCommitment(
    data: Prisma.ShareCommitmentUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.shareCommitment.create({ data });
  }

  createMonthlySessions(
    sessions: Prisma.MonthlySessionUncheckedCreateInput[],
    tx: Prisma.TransactionClient,
  ) {
    return tx.monthlySession.createMany({ data: sessions });
  }

  createRescueFundLedger(
    data: Prisma.RescueFundLedgerUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.rescueFundLedger.create({ data });
  }

  createBeneficiarySchedule(
    data: Prisma.BeneficiaryScheduleUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.beneficiarySchedule.create({ data });
  }

  createSavingsLedger(
    data: Prisma.SavingsLedgerUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.savingsLedger.create({ data });
  }

  createRescueFundPosition(
    data: Prisma.RescueFundPositionUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.rescueFundPosition.create({ data });
  }

  findActiveMemberships(fiscalYearId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.membership.findMany({ where: { fiscalYearId, status: 'ACTIVE' } });
  }

  findRescueFundLedger(fiscalYearId: string) {
    return this.prisma.rescueFundLedger.findUnique({ where: { fiscalYearId } });
  }

  updateRescueFundLedger(
    id: string,
    data: Prisma.RescueFundLedgerUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.rescueFundLedger.update({ where: { id }, data });
  }
}
