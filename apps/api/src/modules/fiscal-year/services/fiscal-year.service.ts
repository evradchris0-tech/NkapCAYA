import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { AddMemberDto } from '../dto/add-member.dto';

@Injectable()
export class FiscalYearService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fiscalYearRepository: FiscalYearRepository,
  ) {}

  async create(dto: CreateFiscalYearDto) {
    throw new Error('Not implemented');
  }

  async activate(id: string) {
    throw new Error('Not implemented');
  }

  async addMember(fiscalYearId: string, dto: AddMemberDto) {
    throw new Error('Not implemented');
  }

  async getMemberships(fiscalYearId: string) {
    throw new Error('Not implemented');
  }
}
