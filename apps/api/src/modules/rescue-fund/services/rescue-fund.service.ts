import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RescueFundRepository } from '../repositories/rescue-fund.repository';
import { CreateRescueFundEventDto } from '../dto/create-rescue-fund-event.dto';

@Injectable()
export class RescueFundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rescueFundRepository: RescueFundRepository,
  ) {}

  async getBalance() {
    throw new Error('Not implemented');
  }

  async recordEvent(dto: CreateRescueFundEventDto) {
    throw new Error('Not implemented');
  }

  async getPositions(membershipId: string) {
    throw new Error('Not implemented');
  }
}
