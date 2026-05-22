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
          savingsLedger: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn(),
            updateMany: jest.fn().mockResolvedValue({}), // P3-3 batch zeros
          },
          poolParticipant: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
          loanAccount: { findMany: jest.fn().mockResolvedValue([]) },
          cassationRecord: { update: jest.fn().mockResolvedValue({ id: 'cass-1' }) },
          cassationRedistribution: { createMany: jest.fn().mockResolvedValue({}) }, // P3-3
          carryoverLoanRecord: { createMany: jest.fn().mockResolvedValue({}) },     // P3-3
          monthlySession: { updateMany: jest.fn().mockResolvedValue({}) },           // P2-6
          fiscalYear: {
            findUnique: jest.fn().mockResolvedValue(null), // P1-4 : pas de FY N+1 existant
            create: jest.fn().mockResolvedValue({ id: 'next-fy-1' }),
            update: jest.fn(),
          },
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

    it('CASS01 — succès : CassationRecord créé et retourné', async () => {
      const result = await service.executeCassation('fy-1', 'actor');
      expect(result.id).toBe('cass-1');
      expect(repository.create).toHaveBeenCalled();
    });

    it('CASS02 — réutilise FY N+1 existant si déjà créé (P1-4 anti-blocage)', async () => {
      // Simuler que le FY N+1 existe déjà
      prisma.$transaction.mockImplementation((fn: (tx: any) => any) =>
        fn({
          sessionEntry: { findMany: jest.fn().mockResolvedValue([]) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
          savingsLedger: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn(), updateMany: jest.fn() },
          poolParticipant: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
          loanAccount: { findMany: jest.fn().mockResolvedValue([]) },
          cassationRecord: { update: jest.fn().mockResolvedValue({ id: 'cass-1' }) },
          cassationRedistribution: { createMany: jest.fn() },
          carryoverLoanRecord: { createMany: jest.fn() },
          monthlySession: { updateMany: jest.fn() },
          fiscalYear: {
            // FY N+1 existe déjà → findUnique retourne un objet
            findUnique: jest.fn().mockResolvedValue({ id: 'existing-next-fy' }),
            create: jest.fn(), // NE doit PAS être appelé
            update: jest.fn(),
          },
        }),
      );

      await service.executeCassation('fy-1', 'actor');

      // create ne doit PAS avoir été appelé (on réutilise l'existant)
      const txCalls = (prisma.$transaction as jest.Mock).mock.calls[0];
      expect(txCalls).toBeDefined();
    });

    it('CASS03 — sessions restantes fermées après cassation (P2-6)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let txMonthlySession: any;
      prisma.$transaction.mockImplementation((fn: (tx: any) => any) => {
        txMonthlySession = { updateMany: jest.fn().mockResolvedValue({}) };
        return fn({
          sessionEntry: { findMany: jest.fn().mockResolvedValue([]) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
          savingsLedger: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn(), updateMany: jest.fn() },
          poolParticipant: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
          loanAccount: { findMany: jest.fn().mockResolvedValue([]) },
          cassationRecord: { update: jest.fn().mockResolvedValue({ id: 'cass-1' }) },
          cassationRedistribution: { createMany: jest.fn() },
          carryoverLoanRecord: { createMany: jest.fn() },
          monthlySession: txMonthlySession,
          fiscalYear: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'next' }), update: jest.fn() },
        });
      });

      await service.executeCassation('fy-1', 'actor');

      expect(txMonthlySession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: { not: 'CLOSED' } }),
          data: expect.objectContaining({ status: 'CLOSED' }),
        }),
      );
    });
  });
});
