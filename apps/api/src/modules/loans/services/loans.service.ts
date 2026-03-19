import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoansRepository } from '../repositories/loans.repository';
import { RequestLoanDto } from '../dto/request-loan.dto';
import { ApplyRepaymentDto } from '../dto/apply-repayment.dto';

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loansRepository: LoansRepository,
  ) {}

  async requestLoan(dto: RequestLoanDto) {
    throw new Error('Not implemented');
  }

  async disburse(loanId: string) {
    throw new Error('Not implemented');
  }

  async applyRepayment(loanId: string, dto: ApplyRepaymentDto) {
    throw new Error('Not implemented');
  }

  async computeMonthlyAccrual(loanId: string, sessionId: string) {
    throw new Error('Not implemented');
  }
}
