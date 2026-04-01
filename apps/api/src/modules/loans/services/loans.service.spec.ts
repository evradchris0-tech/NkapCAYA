import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { LoansRepository } from '../repositories/loans.repository';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { LoanStatus } from '@prisma/client';

const makeLoan = (override: Record<string, unknown> = {}) => ({
  id: 'loan-1',
  membershipId: 'mem-1',
  fiscalYearId: 'fy-1',
  status: LoanStatus.PENDING,
  outstandingBalance: '150000',
  totalRepaid: '0',
  monthlyRate: '0.04',
  ...override,
});

describe('LoansService', () => {
  let service: LoansService;
  let loansRepository: jest.Mocked<Pick<LoansRepository,
    'create' | 'findById' | 'findByMembership' | 'findByFiscalYear' |
    'findActiveLoansForFiscalYear' | 'updateStatus' | 'updateBalance' |
    'createRepayment' | 'createMonthlyAccrual' | 'findLatestAccrual' | 'updateAccrual'
  >>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  beforeEach(async () => {
    loansRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(makeLoan()),
      findByMembership: jest.fn().mockResolvedValue([]),
      findByFiscalYear: jest.fn().mockResolvedValue([]),
      findActiveLoansForFiscalYear: jest.fn().mockResolvedValue([]),
      updateStatus: jest.fn().mockImplementation((id, status, extra) =>
        Promise.resolve({ ...makeLoan(), status, ...extra }),
      ),
      updateBalance: jest.fn().mockResolvedValue({}),
      createRepayment: jest.fn().mockResolvedValue({ id: 'repayment-1' }),
      createMonthlyAccrual: jest.fn().mockResolvedValue({ id: 'accrual-1' }),
      findLatestAccrual: jest.fn().mockResolvedValue(null),
      updateAccrual: jest.fn().mockResolvedValue({}),
    };

    prisma = {
      $transaction: jest.fn().mockRejectedValue(new Error('Not implemented')),
      loanAccount: {
        findUnique: jest.fn().mockResolvedValue(makeLoan({ status: LoanStatus.ACTIVE })),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      monthlyLoanAccrual: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'accrual-1' }),
      },
      monthlySession: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-id',
          sessionNumber: 1,
          fiscalYearId: 'fy-1',
          fiscalYear: { startDate: new Date('2025-10-01') },
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: LoansRepository, useValue: loansRepository },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ── approveLoan() ────────────────────────────────────────────────────────────

  describe('approveLoan()', () => {
    it('A01 — PENDING → ACTIVE, updateStatus appelé avec disbursedAt + disbursedById', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loansRepository.findById.mockResolvedValue(makeLoan({ status: LoanStatus.PENDING }) as any);

      const result = await service.approveLoan('loan-1', 'actor-id');

      expect(loansRepository.updateStatus).toHaveBeenCalledWith(
        'loan-1',
        LoanStatus.ACTIVE,
        expect.objectContaining({ disbursedAt: expect.any(Date), disbursedById: 'actor-id' }),
      );
      expect(result.status).toBe(LoanStatus.ACTIVE);
    });

    it('A02 — NotFoundException si loan absent', async () => {
      loansRepository.findById.mockResolvedValue(null);
      await expect(service.approveLoan('x', 'actor')).rejects.toThrow(NotFoundException);
    });

    it('A03 — ConflictException si loan déjà ACTIVE', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loansRepository.findById.mockResolvedValue(makeLoan({ status: LoanStatus.ACTIVE }) as any);
      await expect(service.approveLoan('loan-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('A04 — ConflictException si loan CLOSED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loansRepository.findById.mockResolvedValue(makeLoan({ status: LoanStatus.CLOSED }) as any);
      await expect(service.approveLoan('loan-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });

  // ── applyRepayment() ─────────────────────────────────────────────────────────

  describe('applyRepayment()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txLoanAccount: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txMonthlySession: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txTransactionSequence: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txSessionEntry: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txLoanRepayment: any;

    beforeEach(() => {
      txLoanAccount = {
        findUnique: jest.fn().mockResolvedValue(
          makeLoan({ status: LoanStatus.ACTIVE, outstandingBalance: '100000', totalRepaid: '0', monthlyRate: '0.04' }),
        ),
      };
      txMonthlySession = {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session-id',
          sessionNumber: 1,
          fiscalYearId: 'fy-1',
          fiscalYear: { startDate: new Date('2025-10-01') },
        }),
        update: jest.fn().mockResolvedValue({}),
      };
      txTransactionSequence = {
        upsert: jest.fn().mockResolvedValue({ lastSequence: 1 }),
      };
      txSessionEntry = {
        create: jest.fn().mockResolvedValue({ id: 'entry-x' }),
      };
      txLoanRepayment = {
        update: jest.fn().mockResolvedValue({}),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.$transaction.mockImplementation((fn: (tx: any) => any) =>
        fn({
          loanAccount: txLoanAccount,
          monthlySession: txMonthlySession,
          transactionSequence: txTransactionSequence,
          sessionEntry: txSessionEntry,
          loanRepayment: txLoanRepayment,
        }),
      );
    });

    it('R01 — remboursement partiel FIFO : intérêts payés en premier', async () => {
      // Intérêts dus : 6000 (balance 100000 × 6%), paiement : 10000
      txLoanAccount.findUnique.mockResolvedValue(
        makeLoan({ status: LoanStatus.ACTIVE, outstandingBalance: '100000', totalRepaid: '0', monthlyRate: '0.06' }),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loansRepository.findLatestAccrual.mockResolvedValue({ id: 'acc-1', interestAccrued: '6000' } as any);

      await service.applyRepayment('loan-1', { amount: 10000, sessionId: 'session-id' }, 'actor');

      expect(loansRepository.createRepayment).toHaveBeenCalledWith(
        expect.objectContaining({
          interestPart: '6000.00',
          principalPart: '4000.00',
        }),
        expect.anything(),
      );
    });

    it('R02 — remboursement total → statut CLOSED, balance = 0', async () => {
      txLoanAccount.findUnique.mockResolvedValue(
        makeLoan({ status: LoanStatus.ACTIVE, outstandingBalance: '10000', totalRepaid: '5000', monthlyRate: '0.04' }),
      );
      loansRepository.findLatestAccrual.mockResolvedValue(null);

      await service.applyRepayment('loan-1', { amount: 12000, sessionId: 'session-id' }, 'actor');

      expect(loansRepository.updateBalance).toHaveBeenCalledWith(
        'loan-1',
        expect.objectContaining({ status: LoanStatus.CLOSED, outstandingBalance: '0.00' }),
        expect.anything(),
      );
    });

    it('R03 — montant < intérêts dus → principalPart = 0, statut PARTIALLY_REPAID', async () => {
      txLoanAccount.findUnique.mockResolvedValue(
        makeLoan({ status: LoanStatus.ACTIVE, outstandingBalance: '80000', totalRepaid: '0', monthlyRate: '0.04' }),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      loansRepository.findLatestAccrual.mockResolvedValue({ id: 'acc-1', interestAccrued: '8000' } as any);

      await service.applyRepayment('loan-1', { amount: 5000, sessionId: 'session-id' }, 'actor');

      expect(loansRepository.createRepayment).toHaveBeenCalledWith(
        expect.objectContaining({
          interestPart: '5000.00',
          principalPart: '0.00',
        }),
        expect.anything(),
      );
      expect(loansRepository.updateBalance).toHaveBeenCalledWith(
        'loan-1',
        expect.objectContaining({ status: LoanStatus.PARTIALLY_REPAID }),
        expect.anything(),
      );
    });

    it('R04 — NotFoundException si loan absent dans la transaction', async () => {
      txLoanAccount.findUnique.mockResolvedValue(null);
      await expect(
        service.applyRepayment('x', { amount: 5000, sessionId: 'session-id' }, 'actor'),
      ).rejects.toThrow(NotFoundException);
    });

    it('R05 — ConflictException si loan CLOSED', async () => {
      txLoanAccount.findUnique.mockResolvedValue(makeLoan({ status: LoanStatus.CLOSED }));
      await expect(
        service.applyRepayment('loan-1', { amount: 5000, sessionId: 'session-id' }, 'actor'),
      ).rejects.toThrow(ConflictException);
    });

    it('R06 — hors-session (sans sessionId) → isOutOfSession = true, pas de mise à jour totalRbt*', async () => {
      txLoanAccount.findUnique.mockResolvedValue(
        makeLoan({ status: LoanStatus.ACTIVE, outstandingBalance: '50000', totalRepaid: '0', monthlyRate: '0.04' }),
      );
      loansRepository.findLatestAccrual.mockResolvedValue(null);

      await service.applyRepayment('loan-1', { amount: 10000 }, 'actor');

      // monthlySession.findUnique non appelé (session=null)
      expect(txMonthlySession.update).not.toHaveBeenCalled();
      expect(loansRepository.createRepayment).toHaveBeenCalled();
    });
  });

  // ── computeMonthlyAccrual() ──────────────────────────────────────────────────

  describe('computeMonthlyAccrual()', () => {
    it('should compute and persist monthly accrual for an active loan', async () => {
      const result = await service.computeMonthlyAccrual('loan-1', 'session-id');
      expect(result).toBeDefined();
      expect(result?.id).toBe('accrual-1');
    });
  });
});
