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
            findById: jest.fn(),
            findByMembership: jest.fn(),
            updateStatus: jest.fn(),
            updateBalance: jest.fn(),
            createRepayment: jest.fn(),
            createMonthlyAccrual: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
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
        service.requestLoan({ membershipId: 'mid', amount: 100000, durationMonths: 6 }),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('disburse()', () => {
    it('should disburse an approved loan', async () => {
      await expect(service.disburse('loan-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('applyRepayment()', () => {
    it('should apply a repayment to a loan', async () => {
      await expect(
        service.applyRepayment('loan-id', { amount: 10000, sessionId: 'session-id' }),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('computeMonthlyAccrual()', () => {
    it('should compute monthly accrual for a loan', async () => {
      await expect(service.computeMonthlyAccrual('loan-id', 'session-id')).rejects.toThrow('Not implemented');
    });
  });
});
