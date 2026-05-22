import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from '../repositories/reports.repository';
import { PrismaService } from '@database/prisma.service';

const mockFiscalYearData = {
  fiscalYear: { id: 'fy-1', label: '2025-2026' },
  memberships: [],
  sessions: [],
  savingsLedgers: [],
  loans: [],
  poolParticipants: [],
};

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: jest.Mocked<Pick<ReportsRepository, 'getFullFiscalYearData'>>;

  beforeEach(async () => {
    repository = {
      getFullFiscalYearData: jest.fn().mockResolvedValue(mockFiscalYearData),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: repository,
        },
        { provide: PrismaService, useValue: {
          tontineConfig: { findUnique: jest.fn().mockResolvedValue({
            shareUnitAmount: '100000', loanMonthlyRate: '0.04',
            maxLoanMultiplier: 5, minSavingsToLoan: '100000',
            maxConcurrentLoans: 2, rescueFundTarget: '50000',
            rescueFundMinBalance: '25000', registrationFeeNew: '10000',
            registrationFeeReturning: '5000',
          })},
          memberProfile: { findMany: jest.fn().mockResolvedValue([]) },
          $transaction: jest.fn().mockResolvedValue({ fiscalYearId: 'fy-1', membersCreated: 0, membersMatched: 0, sessionsCreated: 12 }),
          fiscalYear: { findUnique: jest.fn().mockResolvedValue(null) },
        }},
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('generateAnnualSummary()', () => {
    it('RS01 — délègue à ReportsRepository.getFullFiscalYearData', async () => {
      const result = await service.generateAnnualSummary('fy-1');
      expect(repository.getFullFiscalYearData).toHaveBeenCalledWith('fy-1');
      expect(result).toEqual(mockFiscalYearData);
    });
  });

  describe('generateMemberReport()', () => {
    it('RS02 — not implemented : rejects avec Error', async () => {
      await expect(service.generateMemberReport('m-1')).rejects.toThrow();
    });
  });

  describe('generateSessionReport()', () => {
    it('RS03 — not implemented : rejects avec Error', async () => {
      await expect(service.generateSessionReport('sess-1')).rejects.toThrow();
    });
  });
});
