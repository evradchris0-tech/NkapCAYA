import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BeneficiaryStatus } from '@prisma/client';

const makeSlot = (override = {}) => ({
  id: 'slot-1',
  scheduleId: 'sched-1',
  sessionId: 'sess-1',
  month: 1,
  slotIndex: 1,
  membershipId: null,
  status: BeneficiaryStatus.UNASSIGNED,
  ...override,
});

describe('BeneficiariesService', () => {
  let service: BeneficiariesService;
  let repository: jest.Mocked<BeneficiariesRepository>;
  let prisma: { beneficiarySlot: { findUnique: jest.Mock; findFirst?: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      beneficiarySlot: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiariesService,
        {
          provide: BeneficiariesRepository,
          useValue: {
            findScheduleByFiscalYear: jest.fn().mockResolvedValue({ id: 'sched-1', slots: [] }),
            findSlotById: jest.fn().mockResolvedValue(makeSlot()),
            updateSlot: jest.fn().mockImplementation((id, data) =>
              Promise.resolve({ ...makeSlot(), ...data }),
            ),
            createSchedule: jest.fn(),
            createSlot: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BeneficiariesService>(BeneficiariesService);
    repository = module.get(BeneficiariesRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getSchedule()', () => {
    it('should return beneficiary schedule for a fiscal year', async () => {
      const result = await service.getSchedule('fy-1');
      expect(result.id).toBe('sched-1');
    });

    it('should throw NotFoundException if schedule not found', async () => {
      repository.findScheduleByFiscalYear.mockResolvedValue(null);
      await expect(service.getSchedule('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignSlot()', () => {
    it('should assign a membership to an UNASSIGNED slot', async () => {
      const result = await service.assignSlot('slot-1', { membershipId: 'mem-1' }, 'actor-id');
      expect(result.status).toBe(BeneficiaryStatus.ASSIGNED);
    });

    it('should throw NotFoundException if slot not found', async () => {
      repository.findSlotById.mockResolvedValue(null);
      await expect(service.assignSlot('x', { membershipId: 'mem-1' }, 'actor')).rejects.toThrow(NotFoundException);
    });

    it('should allow reassignment of an already ASSIGNED slot', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findSlotById.mockResolvedValue(makeSlot({ status: BeneficiaryStatus.ASSIGNED }) as any);
      const result = await service.assignSlot('slot-1', { membershipId: 'mem-2' }, 'actor');
      expect(result.status).toBe(BeneficiaryStatus.ASSIGNED);
    });

    it('should throw ConflictException if slot is DELIVERED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findSlotById.mockResolvedValue(makeSlot({ status: BeneficiaryStatus.DELIVERED }) as any);
      await expect(service.assignSlot('slot-1', { membershipId: 'mem-1' }, 'actor')).rejects.toThrow(ConflictException);
    });
  });

  describe('markDelivered()', () => {
    it('should mark an ASSIGNED slot as DELIVERED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findSlotById.mockResolvedValue(makeSlot({ status: BeneficiaryStatus.ASSIGNED }) as any);
      const result = await service.markDelivered('slot-1', 'actor-id');
      expect(result.status).toBe(BeneficiaryStatus.DELIVERED);
    });

    it('should throw ConflictException if slot is not ASSIGNED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findSlotById.mockResolvedValue(makeSlot({ status: BeneficiaryStatus.UNASSIGNED }) as any);
      await expect(service.markDelivered('slot-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });
});
