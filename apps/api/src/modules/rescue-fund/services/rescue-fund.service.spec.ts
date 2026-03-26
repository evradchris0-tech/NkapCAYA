import { Test, TestingModule } from '@nestjs/testing';
import { RescueFundService } from './rescue-fund.service';
import { RescueFundRepository } from '../repositories/rescue-fund.repository';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RescueEventType } from '@prisma/client';

const makeLedger = (override: object = {}) => ({
  id: 'ledger-1',
  fiscalYearId: 'fy-1',
  totalBalance: '500000',
  targetPerMember: '50000',
  minimumPerMember: '25000',
  memberCount: 10,
  ...override,
});

describe('RescueFundService', () => {
  let service: RescueFundService;
  let repository: jest.Mocked<RescueFundRepository>;
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) =>
        fn({
          rescueFundLedger: { findUnique: jest.fn().mockResolvedValue(makeLedger()) },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescueFundService,
        {
          provide: RescueFundRepository,
          useValue: {
            findLedgerByFiscalYear: jest.fn().mockResolvedValue(makeLedger()),
            findEventsByFiscalYear: jest.fn().mockResolvedValue([]),
            findRescueEventAmount: jest.fn().mockResolvedValue({ amount: '50000' }),
            findPositionByMembership: jest.fn().mockResolvedValue(null),
            createEvent: jest.fn().mockResolvedValue({ id: 'event-1' }),
            updateLedger: jest.fn().mockResolvedValue({}),
            updatePosition: jest.fn().mockResolvedValue({}),
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RescueFundService>(RescueFundService);
    repository = module.get(RescueFundRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getLedger()', () => {
    it('should return rescue fund ledger for a fiscal year', async () => {
      const result = await service.getLedger('fy-1');
      expect(result.fiscalYearId).toBe('fy-1');
    });

    it('should throw NotFoundException if ledger not found', async () => {
      repository.findLedgerByFiscalYear.mockResolvedValue(null);
      await expect(service.getLedger('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordEvent()', () => {
    const dto = {
      beneficiaryMembershipId: 'mem-1',
      eventType: RescueEventType.MEMBER_DEATH,
      eventDate: '2026-01-15',
    };

    it('should throw BadRequestException if balance would fall below minimum threshold', async () => {
      // totalBalance = 250000, amount = 50000 → new = 200000 < min (25000 × 10 = 250000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.$transaction.mockImplementationOnce((fn: (tx: any) => any) =>
        fn({
          rescueFundLedger: {
            findUnique: jest.fn().mockResolvedValue(makeLedger({ totalBalance: '250000' })),
          },
        }),
      );
      await expect(service.recordEvent('fy-1', dto, 'actor')).rejects.toThrow(BadRequestException);
    });

    it('should create event and update ledger balance', async () => {
      // totalBalance = 500000, amount = 50000, min = 250000 → new = 450000 → OK
      const result = await service.recordEvent('fy-1', dto, 'actor');
      expect(result.id).toBe('event-1');
      expect(repository.createEvent).toHaveBeenCalled();
      expect(repository.updateLedger).toHaveBeenCalled();
    });
  });

  describe('getEvents()', () => {
    it('should return rescue fund events for a fiscal year', async () => {
      const result = await service.getEvents('fy-1');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
