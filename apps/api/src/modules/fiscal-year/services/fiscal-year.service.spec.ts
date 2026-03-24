import { Test, TestingModule } from '@nestjs/testing';
import { FiscalYearService } from './fiscal-year.service';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { ConfigService as TontineConfigService } from '../../config/services/config.service';
import { PrismaService } from '@database/prisma.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FiscalYearStatus, EnrollmentType } from '@prisma/client';

const pendingFY = {
  id: 'fy-1',
  label: '2025-2026',
  startDate: new Date('2025-10-01'),
  endDate: new Date('2026-09-30'),
  cassationDate: new Date('2026-08-31'),
  loanDueDate: new Date('2026-06-30'),
  status: FiscalYearStatus.PENDING,
  config: null,
};

const activeFY = {
  ...pendingFY,
  status: FiscalYearStatus.ACTIVE,
  config: { shareUnitAmount: '100000' },
};

describe('FiscalYearService', () => {
  let service: FiscalYearService;
  let repository: jest.Mocked<FiscalYearRepository>;
  let configService: jest.Mocked<TontineConfigService>;
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) =>
        fn({
          beneficiarySlot: { createMany: jest.fn().mockResolvedValue({}) },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalYearService,
        {
          provide: FiscalYearRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(pendingFY),
            findAll: jest.fn().mockResolvedValue([pendingFY]),
            findById: jest.fn().mockResolvedValue(pendingFY),
            findActive: jest.fn().mockResolvedValue(null),
            findOverlapping: jest.fn().mockResolvedValue(null),
            updateStatus: jest.fn().mockResolvedValue({ ...pendingFY, status: FiscalYearStatus.ACTIVE }),
            findMemberships: jest.fn().mockResolvedValue([]),
            findMembership: jest.fn().mockResolvedValue(null),
            createMembership: jest.fn().mockResolvedValue({ id: 'mem-1' }),
            createShareCommitment: jest.fn().mockResolvedValue({}),
            createMonthlySessions: jest.fn().mockResolvedValue({ count: 12 }),
            createRescueFundLedger: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
            createBeneficiarySchedule: jest.fn().mockResolvedValue({ id: 'sched-1' }),
            createSavingsLedger: jest.fn().mockResolvedValue({}),
            createRescueFundPosition: jest.fn().mockResolvedValue({}),
            findActiveMemberships: jest.fn().mockResolvedValue([]),
            findRescueFundLedger: jest.fn().mockResolvedValue(null),
            updateRescueFundLedger: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: TontineConfigService,
          useValue: {
            snapshotForFiscalYear: jest.fn().mockResolvedValue({ id: 'fyc-1' }),
            findConfig: jest.fn().mockResolvedValue({ shareUnitAmount: '100000' }),
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FiscalYearService>(FiscalYearService);
    repository = module.get(FiscalYearRepository);
    configService = module.get(TontineConfigService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create()', () => {
    const validDto = {
      label: '2025-2026',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
      cassationDate: '2026-08-31',
      loanDueDate: '2026-06-30',
    };

    it('should create a fiscal year with valid dates', async () => {
      const result = await service.create(validDto, 'actor-id');
      expect(repository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if date order is invalid', async () => {
      await expect(
        service.create({ ...validDto, loanDueDate: '2027-01-01' }, 'actor-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if overlapping fiscal year exists', async () => {
      repository.findOverlapping.mockResolvedValue(pendingFY as any);
      await expect(service.create(validDto, 'actor-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('activate()', () => {
    it('should activate a PENDING fiscal year atomically', async () => {
      await service.activate('fy-1', 'actor-id');
      expect(configService.snapshotForFiscalYear).toHaveBeenCalledWith('fy-1', 'actor-id', expect.anything());
      expect(repository.createMonthlySessions).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ sessionNumber: 1 })]),
        expect.anything(),
      );
      expect(repository.createRescueFundLedger).toHaveBeenCalled();
      expect(repository.createBeneficiarySchedule).toHaveBeenCalled();
    });

    it('should throw NotFoundException if fiscal year not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.activate('nonexistent', 'actor-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if status is not PENDING', async () => {
      repository.findById.mockResolvedValue(activeFY as any);
      await expect(service.activate('fy-1', 'actor-id')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if another ACTIVE fiscal year exists', async () => {
      repository.findActive.mockResolvedValue(activeFY as any);
      await expect(service.activate('fy-1', 'actor-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('openCassation()', () => {
    it('should transition ACTIVE → CASSATION', async () => {
      repository.findById.mockResolvedValue(activeFY as any);
      await service.openCassation('fy-1', 'actor-id');
      expect(repository.updateStatus).toHaveBeenCalledWith('fy-1', FiscalYearStatus.CASSATION);
    });

    it('should throw ConflictException if not ACTIVE', async () => {
      await expect(service.openCassation('fy-1', 'actor-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('addMember()', () => {
    const dto = {
      profileId: 'profile-1',
      enrollmentType: EnrollmentType.NEW,
      sharesCount: 1,
      joinedAt: '2025-10-01',
      joinedAtMonth: 1,
    };

    it('should add a member to a PENDING fiscal year', async () => {
      await service.addMember('fy-1', dto, 'actor-id');
      expect(repository.createMembership).toHaveBeenCalled();
      expect(repository.createShareCommitment).toHaveBeenCalled();
    });

    it('should calculate catchUpAmount for MID_YEAR enrollment', async () => {
      await service.addMember(
        'fy-1',
        { ...dto, enrollmentType: EnrollmentType.MID_YEAR, joinedAtMonth: 4 },
        'actor-id',
      );
      expect(repository.createMembership).toHaveBeenCalledWith(
        expect.objectContaining({ catchUpAmount: expect.any(Object) }),
        expect.anything(),
      );
    });

    it('should throw ForbiddenException if fiscal year is CASSATION', async () => {
      repository.findById.mockResolvedValue({ ...pendingFY, status: FiscalYearStatus.CASSATION } as any);
      await expect(service.addMember('fy-1', dto, 'actor-id')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if member already enrolled', async () => {
      repository.findMembership.mockResolvedValue({ id: 'existing' } as any);
      await expect(service.addMember('fy-1', dto, 'actor-id')).rejects.toThrow(ConflictException);
    });
  });
});
