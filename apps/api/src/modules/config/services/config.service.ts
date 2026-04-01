import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ConfigRepository } from '../repositories/config.repository';
import { UpdateConfigDto } from '../dto/update-config.dto';
import { Prisma, RescueEventType } from '@prisma/client';

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configRepository: ConfigRepository,
  ) {}

  async findConfig() {
    const [config, rescueEvents] = await Promise.all([
      this.configRepository.findTontineConfig(),
      this.configRepository.findRescueEventAmounts(),
    ]);
    if (!config) throw new NotFoundException('Configuration CAYA introuvable (id=caya)');
    return { ...config, rescueEvents };
  }

  async updateConfig(dto: UpdateConfigDto, actorId: string) {
    const data: Prisma.TontineConfigUpdateInput = { ...dto, updatedBy: { connect: { id: actorId } } };
    return this.configRepository.updateTontineConfig(data);
  }

  async snapshotForFiscalYear(
    fiscalYearId: string,
    actorId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const config = await this.configRepository.findTontineConfig();
    if (!config) throw new NotFoundException('Configuration CAYA introuvable');
    return this.configRepository.createFiscalYearConfig(
      {
        fiscalYearId,
        snapshotById: actorId,
        shareUnitAmount: config.shareUnitAmount,
        loanMonthlyRate: config.loanMonthlyRate,
        maxLoanMultiplier: config.maxLoanMultiplier,
        minSavingsToLoan: config.minSavingsToLoan,
        maxConcurrentLoans: config.maxConcurrentLoans,
        rescueFundTarget: config.rescueFundTarget,
        rescueFundMinBalance: config.rescueFundMinBalance,
        registrationFeeNew: config.registrationFeeNew,
        registrationFeeReturning: config.registrationFeeReturning,
      },
      tx,
    );
  }

  async findRescueEventAmounts() {
    return this.configRepository.findRescueEventAmounts();
  }

  async updateRescueEventAmount(eventType: RescueEventType, amount: number, actorId: string) {
    return this.configRepository.updateRescueEventAmount(eventType, amount, actorId);
  }
}
