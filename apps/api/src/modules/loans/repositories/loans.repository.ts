import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findById(_id: string) {
    throw new Error('Not implemented');
  }

  async findByMembership(_membershipId: string) {
    throw new Error('Not implemented');
  }

  async updateStatus(_id: string, _status: string) {
    throw new Error('Not implemented');
  }

  async updateBalance(_id: string, _data: unknown) {
    throw new Error('Not implemented');
  }

  async createRepayment(_data: unknown) {
    throw new Error('Not implemented');
  }

  async createMonthlyAccrual(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findActiveLoans() {
    throw new Error('Not implemented');
  }

  async createCarryoverRecord(_data: unknown) {
    throw new Error('Not implemented');
  }
}
