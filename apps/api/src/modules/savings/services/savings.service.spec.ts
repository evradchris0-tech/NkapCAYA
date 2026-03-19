import { Test, TestingModule } from '@nestjs/testing';
import { SavingsService } from './savings.service';
import { SavingsRepository } from '../repositories/savings.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('SavingsService', () => {
  let service: SavingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavingsService,
        {
          provide: SavingsRepository,
          useValue: {
            findLedgerByMembership: jest.fn(),
            createEntry: jest.fn(),
            findPoolParticipants: jest.fn(),
            createInterestSnapshot: jest.fn(),
            createInterestAllocation: jest.fn(),
            updateLedgerBalance: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<SavingsService>(SavingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance()', () => {
    it('should return savings balance for a membership', async () => {
      await expect(service.getBalance('membership-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('distributeInterests()', () => {
    it('should distribute interests for a session', async () => {
      await expect(service.distributeInterests('session-id')).rejects.toThrow('Not implemented');
    });
  });
});
