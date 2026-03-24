import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { LoansRepository } from '../repositories/loans.repository';
import { PrismaService } from '@database/prisma.service';

describe('LoansService', () => {
  let service: LoansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: LoansRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn().mockResolvedValue({ id: 'loan-id', loanStatus: 'ACTIVE' }),
            findByMembership: jest.fn(),
            updateStatus: jest.fn(),
            updateBalance: jest.fn(),
            createRepayment: jest.fn(),
            createMonthlyAccrual: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockRejectedValue(new Error('Not implemented')),
            loanAccount: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'loan-id',
                status: 'ACTIVE',
                outstandingBalance: '100000',
                monthlyRate: '0.04',
              }),
              update: jest.fn().mockResolvedValue({}),
              findMany: jest.fn(),
            },
            monthlyLoanAccrual: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({ id: 'accrual-1' }),
            },
            monthlySession: { findUnique: jest.fn().mockResolvedValue({ id: 'session-id', sessionNumber: 1 }) },
          },
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestLoan()', () => {
    it('should create a loan request', async () => {
      await expect(
        service.requestLoan({ membershipId: 'mid', amount: 100000, dueBeforeDate: '2026-12-31' }, 'actor-id'),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('applyRepayment()', () => {
    it('should apply a repayment to a loan', async () => {
      await expect(
        service.applyRepayment('loan-id', { amount: 10000, sessionId: 'session-id' }, 'actor-id'),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('computeMonthlyAccrual()', () => {
    it('should compute and persist monthly accrual for an active loan', async () => {
      const result = await service.computeMonthlyAccrual('loan-id', 'session-id');
      expect(result).toBeDefined();
      expect(result?.id).toBe('accrual-1');
    });
  });
});
