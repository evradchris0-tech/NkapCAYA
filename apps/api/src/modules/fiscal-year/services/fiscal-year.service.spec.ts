import { Test, TestingModule } from '@nestjs/testing';
import { FiscalYearService } from './fiscal-year.service';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { PrismaService } from '@database/prisma.service';

describe('FiscalYearService', () => {
  let service: FiscalYearService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalYearService,
        {
          provide: FiscalYearRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findActive: jest.fn(),
            updateStatus: jest.fn(),
            findMemberships: jest.fn(),
            createMembership: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<FiscalYearService>(FiscalYearService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new fiscal year', async () => {
      await expect(
        service.create({ label: '2026', startDate: '2026-01-01', endDate: '2026-12-31' }),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('activate()', () => {
    it('should activate a fiscal year', async () => {
      await expect(service.activate('fy-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('addMember()', () => {
    it('should add a member to a fiscal year', async () => {
      await expect(service.addMember('fy-id', { memberId: 'member-id' })).rejects.toThrow('Not implemented');
    });
  });

  describe('getMemberships()', () => {
    it('should return memberships for a fiscal year', async () => {
      await expect(service.getMemberships('fy-id')).rejects.toThrow('Not implemented');
    });
  });
});
