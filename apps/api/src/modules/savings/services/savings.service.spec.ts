import { Test, TestingModule } from '@nestjs/testing';
import { SavingsService } from './savings.service';
import { SavingsRepository } from '../repositories/savings.repository';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException } from '@nestjs/common';

const makeLedger = (override = {}) => ({
  id: 'ledger-1',
  membershipId: 'mem-1',
  balance: '500000',
  principalBalance: '500000',
  totalInterestReceived: '0',
  entries: [],
  ...override,
});

describe('SavingsService', () => {
  let service: SavingsService;
  let repository: jest.Mocked<SavingsRepository>;
  let prisma: { $transaction: jest.Mock; monthlySession: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      monthlySession: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sess-1',
          sessionNumber: 1,
          fiscalYearId: 'fy-1',
          fiscalYear: { config: { interestPoolMethod: 'THEORETICAL' } },
        }),
      },
      $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) =>
        fn({
          sessionEntry: { findMany: jest.fn().mockResolvedValue([]) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
          savingsLedger: { findMany: jest.fn().mockResolvedValue([]) },
          poolParticipant: { findMany: jest.fn().mockResolvedValue([]) },
          interestDistributionSnapshot: { create: jest.fn().mockResolvedValue({ id: 'snap-1' }) },
          savingsEntry: { create: jest.fn() },
          interestAllocation: { create: jest.fn() },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingsService,
        {
          provide: SavingsRepository,
          useValue: {
            findLedgerByMembership: jest.fn().mockResolvedValue(makeLedger()),
            findLedgersByFiscalYear: jest.fn().mockResolvedValue([makeLedger()]),
            createEntry: jest.fn().mockResolvedValue({}),
            findPoolParticipants: jest.fn().mockResolvedValue([]),
            createInterestSnapshot: jest.fn().mockResolvedValue({ id: 'snap-1' }),
            createInterestAllocation: jest.fn().mockResolvedValue({}),
            updateLedgerBalance: jest.fn().mockResolvedValue({}),
            findInterestSnapshot: jest.fn().mockResolvedValue({ id: 'snap-1', allocations: [] }),
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SavingsService>(SavingsService);
    repository = module.get(SavingsRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getBalance()', () => {
    it('should return savings ledger for a membership', async () => {
      const result = await service.getBalance('mem-1');
      expect(result.membershipId).toBe('mem-1');
      expect(repository.findLedgerByMembership).toHaveBeenCalledWith('mem-1');
    });

    it('should throw NotFoundException if ledger not found', async () => {
      repository.findLedgerByMembership.mockResolvedValue(null);
      await expect(service.getBalance('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('distributeInterests()', () => {
    it('should resolve if interest pool is zero (no loans to distribute)', async () => {
      // Default mock returns no accruals → pool = 0 → no-op
      await expect(service.distributeInterests('sess-1', 'actor')).resolves.toBeDefined();
    });

    it('should throw NotFoundException if session not found', async () => {
      prisma.monthlySession.findUnique.mockResolvedValue(null);
      await expect(service.distributeInterests('x', 'actor')).rejects.toThrow(NotFoundException);
    });
  });
});
