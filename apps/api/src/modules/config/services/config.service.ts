import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { ConfigRepository } from '../repositories/config.repository';
import { UpdateConfigDto } from '../dto/update-config.dto';

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configRepository: ConfigRepository,
  ) {}

  async findConfig() {
    throw new Error('Not implemented');
  }

  async updateConfig(dto: UpdateConfigDto) {
    throw new Error('Not implemented');
  }

  async snapshotForFiscalYear(fiscalYearId: string) {
    throw new Error('Not implemented');
  }
}
