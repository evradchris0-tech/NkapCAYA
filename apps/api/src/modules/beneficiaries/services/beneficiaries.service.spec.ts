import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';
import { PrismaService } from '@database/prisma.service';

describe('BeneficiariesService', () => {
  let service: BeneficiariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BeneficiariesService,
        {
          provide: BeneficiariesRepository,
          useValue: {
            findScheduleByFiscalYear: jest.fn(),
            findSlotById: jest.fn(),
            findSlotsBySchedule: jest.fn(),
            updateSlot: jest.fn(),
            createSchedule: jest.fn(),
            createSlot: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<BeneficiariesService>(BeneficiariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSchedule()', () => {
    it('should return beneficiary schedule for a fiscal year', async () => {
      await expect(service.getSchedule('fy-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('assignSlot()', () => {
    it('should assign a membership to a slot', async () => {
      await expect(service.assignSlot('slot-id', { membershipId: 'membership-id' })).rejects.toThrow('Not implemented');
    });
  });

  describe('markDelivered()', () => {
    it('should mark a slot as delivered', async () => {
      await expect(service.markDelivered('slot-id')).rejects.toThrow('Not implemented');
    });
  });
});
