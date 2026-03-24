import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigRepository } from '../repositories/config.repository';
import { PrismaService } from '@database/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockTontineConfig = {
  id: 'caya',
  name: 'Club des Amis de Yaoundé',
  acronym: 'CAYA',
  foundedYear: 2000,
  shareUnitAmount: '100000',
  halfShareAmount: '50000',
  potMonthlyAmount: '3000',
  maxSharesPerMember: 10,
  mandatoryInitialSavings: '100000',
  loanMonthlyRate: '0.04',
  minLoanAmount: '10000',
  maxLoanAmount: '1000000',
  maxLoanMultiplier: 5,
  minSavingsToLoan: '100000',
  maxConcurrentLoans: 2,
  rescueFundTarget: '50000',
  rescueFundMinBalance: '25000',
  registrationFeeNew: '3000',
  registrationFeeReturning: '1000',
  updatedAt: new Date(),
  updatedById: 'admin-id',
};

describe('ConfigService', () => {
  let service: ConfigService;
  let repository: jest.Mocked<ConfigRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: ConfigRepository,
          useValue: {
            findTontineConfig: jest.fn().mockResolvedValue(mockTontineConfig),
            updateTontineConfig: jest.fn().mockResolvedValue(mockTontineConfig),
            countActiveFiscalYears: jest.fn().mockResolvedValue(0),
            findRescueEventAmounts: jest.fn().mockResolvedValue([]),
            findRescueEventAmount: jest.fn().mockResolvedValue({ eventType: 'MARRIAGE', amount: '200000' }),
            updateRescueEventAmount: jest.fn().mockResolvedValue({ eventType: 'MARRIAGE', amount: '250000' }),
            createFiscalYearConfig: jest.fn().mockResolvedValue({ id: 'fyc-1', fiscalYearId: 'fy-1' }),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    repository = module.get(ConfigRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('findConfig()', () => {
    it('should return config with rescue events', async () => {
      const result = await service.findConfig();
      expect(result).toHaveProperty('id', 'caya');
      expect(result).toHaveProperty('rescueEvents');
      expect(repository.findTontineConfig).toHaveBeenCalled();
    });

    it('should throw NotFoundException if config absent', async () => {
      repository.findTontineConfig.mockResolvedValue(null);
      await expect(service.findConfig()).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateConfig()', () => {
    it('should update config when no ACTIVE fiscal year', async () => {
      const result = await service.updateConfig({ loanMonthlyRate: 0.04 }, 'actor-id');
      expect(repository.updateTontineConfig).toHaveBeenCalledWith(
        expect.objectContaining({ loanMonthlyRate: 0.04, updatedBy: { connect: { id: 'actor-id' } } }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ConflictException when an ACTIVE fiscal year exists', async () => {
      repository.countActiveFiscalYears.mockResolvedValue(1);
      await expect(service.updateConfig({}, 'actor-id')).rejects.toThrow(ConflictException);
    });
  });

  describe('snapshotForFiscalYear()', () => {
    it('should create a FiscalYearConfig snapshot from TontineConfig', async () => {
      const result = await service.snapshotForFiscalYear('fy-id', 'actor-id');
      expect(repository.createFiscalYearConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          fiscalYearId: 'fy-id',
          snapshotById: 'actor-id',
          shareUnitAmount: mockTontineConfig.shareUnitAmount,
          loanMonthlyRate: mockTontineConfig.loanMonthlyRate,
        }),
        undefined,
      );
      expect(result).toHaveProperty('id');
    });

    it('should forward the transaction client to createFiscalYearConfig', async () => {
      const mockTx = {} as any;
      await service.snapshotForFiscalYear('fy-id', 'actor-id', mockTx);
      expect(repository.createFiscalYearConfig).toHaveBeenCalledWith(
        expect.any(Object),
        mockTx,
      );
    });

    it('should throw NotFoundException if config absent', async () => {
      repository.findTontineConfig.mockResolvedValue(null);
      await expect(service.snapshotForFiscalYear('fy-id', 'actor-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRescueEventAmount()', () => {
    it('should update rescue event amount', async () => {
      const result = await service.updateRescueEventAmount('MARRIAGE', 250000, 'actor-id');
      expect(repository.updateRescueEventAmount).toHaveBeenCalledWith('MARRIAGE', 250000, 'actor-id');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if event type absent', async () => {
      repository.findRescueEventAmount.mockResolvedValue(null);
      await expect(service.updateRescueEventAmount('BIRTH', 50000, 'actor-id')).rejects.toThrow(NotFoundException);
    });
  });
});
