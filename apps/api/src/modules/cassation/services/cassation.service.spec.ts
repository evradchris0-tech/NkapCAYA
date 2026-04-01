import { Test, TestingModule } from '@nestjs/testing';
import { CassationService } from './cassation.service';
import { CassationRepository } from '../repositories/cassation.repository';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FiscalYearStatus } from '@prisma/client';

const makeFiscalYear = (status: FiscalYearStatus = FiscalYearStatus.CASSATION) => ({
  id: 'fy-1',
  status,
  startDate: new Date('2025-10-01'),
  endDate: new Date('2026-09-30'),
  cassationDate: new Date('2026-08-31'),
  loanDueDate: new Date('2026-06-30'),
  config: { interestPoolMethod: 'THEORETICAL' },
});

describe('CassationService', () => {
  let service: CassationService;
  let repository: jest.Mocked<CassationRepository>;
  let prisma: {
    fiscalYear: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
    user: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      fiscalYear: {
        findUnique: jest.fn().mockResolvedValue(makeFiscalYear()),
        update: jest.fn().mockResolvedValue({}),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) =>
        fn({
          sessionEntry: { findMany: jest.fn().mockResolvedValue([]) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
          savingsLedger: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
          poolParticipant: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
          loanAccount: { findMany: jest.fn().mockResolvedValue([]) },
          cassationRecord: { update: jest.fn().mockResolvedValue({ id: 'cass-1' }) },
          carryoverLoanRecord: { create: jest.fn() },
          fiscalYear: { create: jest.fn().mockResolvedValue({ id: 'next-fy-1' }), update: jest.fn() },
        }),
      ),
      user: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CassationService,
        {
          provide: CassationRepository,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'cass-1' }),
            findById: jest.fn().mockResolvedValue({ id: 'cass-1', redistributions: [], participantShares: [] }),
            findByFiscalYear: jest.fn().mockResolvedValue({ id: 'cass-1', redistributions: [], participantShares: [] }),
            createRedistribution: jest.fn().mockResolvedValue({}),
            createPoolParticipantShare: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: NotificationsService,
          useValue: { sendSMS: jest.fn().mockResolvedValue(undefined) },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CassationService>(CassationService);
    repository = module.get(CassationRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('findById()', () => {
    it('should return a cassation record by ID', async () => {
      const result = await service.findById('cass-1');
      expect(result.id).toBe('cass-1');
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('executeCassation()', () => {
    it('should throw NotFoundException if fiscal year not found', async () => {
      prisma.fiscalYear.findUnique.mockResolvedValue(null);
      await expect(service.executeCassation('x', 'actor')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if fiscal year is not CASSATION', async () => {
      prisma.fiscalYear.findUnique.mockResolvedValue(makeFiscalYear(FiscalYearStatus.ACTIVE));
      await expect(service.executeCassation('fy-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('should execute cassation and return cassation record', async () => {
      const result = await service.executeCassation('fy-1', 'actor');
      expect(result.id).toBe('cass-1');
      expect(repository.create).toHaveBeenCalled();
    });
  });
});
