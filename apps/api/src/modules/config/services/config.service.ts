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

  async updateConfig(_dto: UpdateConfigDto) {
    throw new Error('Not implemented');
  }

  async snapshotForFiscalYear(_fiscalYearId: string) {
    throw new Error('Not implemented');
  }
}
