import { Test, TestingModule } from '@nestjs/testing';
import { RescueFundService } from './rescue-fund.service';
import { RescueFundRepository } from '../repositories/rescue-fund.repository';
import { PrismaService } from '@database/prisma.service';
import { RescueFundEventType } from '../dto/create-rescue-fund-event.dto';

describe('RescueFundService', () => {
  let service: RescueFundService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RescueFundService,
        {
          provide: RescueFundRepository,
          useValue: {
            findGlobalLedger: jest.fn(),
            createEvent: jest.fn(),
            findEvents: jest.fn(),
            findPositionByMembership: jest.fn(),
            upsertPosition: jest.fn(),
            updateLedgerBalance: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<RescueFundService>(RescueFundService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBalance()', () => {
    it('should return rescue fund global balance', async () => {
      await expect(service.getBalance()).rejects.toThrow('Not implemented');
    });
  });

  describe('recordEvent()', () => {
    it('should record a rescue fund event', async () => {
      await expect(
        service.recordEvent({
          eventType: RescueFundEventType.DISBURSEMENT,
          amount: 50000,
          membershipId: 'membership-id',
        }),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('getPositions()', () => {
    it('should return rescue fund positions for a membership', async () => {
      await expect(service.getPositions('membership-id')).rejects.toThrow('Not implemented');
    });
  });
});
