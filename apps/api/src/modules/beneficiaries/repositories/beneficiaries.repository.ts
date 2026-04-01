import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BeneficiariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findScheduleByFiscalYear(fiscalYearId: string) {
    return this.prisma.beneficiarySchedule.findUnique({
      where: { fiscalYearId },
      include: {
        slots: {
          orderBy: [{ month: 'asc' }, { slotIndex: 'asc' }],
          include: { membership: { include: { profile: true } }, session: true },
        },
      },
    });
  }

  findSlotById(id: string) {
    return this.prisma.beneficiarySlot.findUnique({
      where: { id },
      include: { schedule: true, session: true },
    });
  }

  updateSlot(id: string, data: Prisma.BeneficiarySlotUpdateInput) {
    return this.prisma.beneficiarySlot.update({ where: { id }, data });
  }

  createSchedule(data: Prisma.BeneficiaryScheduleUncheckedCreateInput) {
    return this.prisma.beneficiarySchedule.create({ data });
  }

  createSlot(data: Prisma.BeneficiarySlotUncheckedCreateInput) {
    return this.prisma.beneficiarySlot.create({ data });
  }

  findSlotsBySession(sessionId: string) {
    return this.prisma.beneficiarySlot.findMany({ where: { sessionId } });
  }

  clearHostForSession(sessionId: string, excludeSlotId: string) {
    return this.prisma.beneficiarySlot.updateMany({
      where: { sessionId, id: { not: excludeSlotId } },
      data: { isHost: false },
    });
  }

  deleteSlot(id: string) {
    return this.prisma.beneficiarySlot.delete({ where: { id } });
  }
}
