import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    throw new Error('Not implemented');
  }

  async findById(id: string) {
    throw new Error('Not implemented');
  }

  async findByMembership(membershipId: string) {
    throw new Error('Not implemented');
  }

  async updateStatus(id: string, status: string) {
    throw new Error('Not implemented');
  }

  async updateBalance(id: string, data: any) {
    throw new Error('Not implemented');
  }

  async createRepayment(data: any) {
    throw new Error('Not implemented');
  }

  async createMonthlyAccrual(data: any) {
    throw new Error('Not implemented');
  }

  async findActiveLoans() {
    throw new Error('Not implemented');
  }

  async createCarryoverRecord(data: any) {
    throw new Error('Not implemented');
  }
}
