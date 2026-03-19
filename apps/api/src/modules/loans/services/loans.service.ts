import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { LoansRepository } from '../repositories/loans.repository';
import { RequestLoanDto } from '../dto/request-loan.dto';
import { ApplyRepaymentDto } from '../dto/apply-repayment.dto';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loansRepository: LoansRepository,
  ) {}

  async requestLoan(_dto: RequestLoanDto) {
    throw new Error('Not implemented');
  }

  async disburse(_loanId: string) {
    throw new Error('Not implemented');
  }

  async applyRepayment(_loanId: string, _dto: ApplyRepaymentDto) {
    throw new Error('Not implemented');
  }

  async computeMonthlyAccrual(_loanId: string, _sessionId: string) {
    throw new Error('Not implemented');
  }
}
