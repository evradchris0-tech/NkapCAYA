import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import { LoansService } from '../../loans/services/loans.service';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SessionStatus, TransactionType } from '@prisma/client';

// ── Factories ────────────────────────────────────────────────────────────────

const makeFiscalYear = () => ({
  id: 'fy-1',
  startDate: new Date('2025-10-01'),
  config: { interestPoolMethod: 'THEORETICAL', shareUnitAmount: '100000' },
});

const makeSession = (override: Record<string, unknown> = {}) => ({
  id: 'sess-1',
  fiscalYearId: 'fy-1',
  sessionNumber: 1,
  status: SessionStatus.DRAFT,
  fiscalYear: makeFiscalYear(),
  entries: [],
  ...override,
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: jest.Mocked<SessionsRepository>;
  let loansService: jest.Mocked<Pick<LoansService, 'computeAccrualsForSession'>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  beforeEach(async () => {
    // LoansService mock — computeAccrualsForSession fire-and-forget
    loansService = {
      computeAccrualsForSession: jest.fn().mockResolvedValue([]),
    };

    prisma = {
      monthlySession: { findFirst: jest.fn().mockResolvedValue(null) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) => fn({
        monthlySession: { findUnique: jest.fn().mockResolvedValue(makeSession()) },
        membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
        sessionEntry: { findMany: jest.fn().mockResolvedValue([]) },
        monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
        savingsLedger: {
          findUnique: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        savingsEntry: { create: jest.fn(), createMany: jest.fn() },
        poolParticipant: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
        interestDistributionSnapshot: { create: jest.fn().mockResolvedValue({ id: 'snap-1' }) },
        interestAllocation: { create: jest.fn(), createMany: jest.fn() },
        rescueFundPosition: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
        rescueFundLedger: { update: jest.fn() },
        transactionSequence: { upsert: jest.fn().mockResolvedValue({ lastSequence: 1 }) },
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: SessionsRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(makeSession()),
            findByFiscalYear: jest.fn().mockResolvedValue([makeSession()]),
            findPreviousSession: jest.fn().mockResolvedValue(null),
            updateStatus: jest.fn().mockImplementation((id, status) =>
              Promise.resolve({ ...makeSession(), status }),
            ),
            createEntry: jest.fn().mockResolvedValue({ id: 'entry-1', reference: 'CAYA-2025-10-COT-0001' }),
            countEntriesByType: jest.fn().mockResolvedValue(0),
            incrementSessionTotal: jest.fn().mockResolvedValue({}),
          },
        },
        { provide: LoansService, useValue: loansService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get(SessionsRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  // ── openSession() ────────────────────────────────────────────────────────────

  describe('openSession()', () => {
    it('O01 — session 1 DRAFT → OPEN, updateStatus appelé avec openedById', async () => {
      const result = await service.openSession('sess-1', 'actor-id');
      expect(result.status).toBe(SessionStatus.OPEN);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'sess-1',
        SessionStatus.OPEN,
        expect.objectContaining({ openedById: 'actor-id' }),
      );
    });

    it('O02 — computeAccrualsForSession déclenché en fire-and-forget', async () => {
      await service.openSession('sess-1', 'actor-id');
      // Pas d'await côté service, mais appelé
      expect(loansService.computeAccrualsForSession).toHaveBeenCalledWith('fy-1', 'sess-1');
    });

    it('O03 — NotFoundException si session absente', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.openSession('x', 'actor')).rejects.toThrow(NotFoundException);
    });

    it('O04 — ConflictException si déjà OPEN', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('O05 — ConflictException si SESS-04 : session précédente non CLOSED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ sessionNumber: 2 }) as any);
      repository.findPreviousSession.mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeSession({ sessionNumber: 1, status: SessionStatus.OPEN }) as any,
      );
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('O06 — succès si session précédente CLOSED (SESS-04 satisfait)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ sessionNumber: 2 }) as any);
      repository.findPreviousSession.mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeSession({ sessionNumber: 1, status: SessionStatus.CLOSED }) as any,
      );
      const result = await service.openSession('sess-1', 'actor');
      expect(result.status).toBe(SessionStatus.OPEN);
    });

    it('O07 — une autre session OPEN bloque (une seule session ouverte à la fois)', async () => {
      prisma.monthlySession.findFirst.mockResolvedValue(
        makeSession({ id: 'autre-sess', status: SessionStatus.OPEN, sessionNumber: 1 }),
      );
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });

  // ── closeForReview() ─────────────────────────────────────────────────────────

  describe('closeForReview()', () => {
    it('C01 — OPEN → REVIEWING sans closedAt (réservé à validateAndClose)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await service.closeForReview('sess-1', 'actor');
      expect(repository.updateStatus).toHaveBeenCalledWith('sess-1', SessionStatus.REVIEWING);
      // Vérifier que closedAt n'est PAS passé
      const callArgs = (repository.updateStatus as jest.Mock).mock.calls[0];
      expect(callArgs[2]).toBeUndefined();
    });

    it('C02 — ConflictException si statut != OPEN', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.DRAFT }) as any);
      await expect(service.closeForReview('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });

  // ── validateAndClose() ───────────────────────────────────────────────────────

  describe('validateAndClose()', () => {
    it('V01 — REVIEWING → CLOSED avec closedAt + closedById', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.REVIEWING }) as any);
      await service.validateAndClose('sess-1', 'actor');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'sess-1',
        SessionStatus.CLOSED,
        expect.objectContaining({ closedById: 'actor' }),
        expect.anything(),
      );
    });

    it('V02 — ConflictException si statut != REVIEWING', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await expect(service.validateAndClose('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });

  // ── recordEntry() : validation RBT_* sans loanId ─────────────────────────────

  describe('recordEntry() — validation RBT_*', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txCtx: any;

    beforeEach(() => {
      txCtx = {
        monthlySession: {
          findUnique: jest.fn().mockResolvedValue(makeSession({ status: SessionStatus.OPEN })),
          update: jest.fn(),
        },
        membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
        sessionEntry: { create: jest.fn().mockResolvedValue({ id: 'e-1', reference: 'ref' }) },
        transactionSequence: { upsert: jest.fn().mockResolvedValue({ lastSequence: 1 }) },
        rescueFundPosition: { findUnique: jest.fn().mockResolvedValue(null) },
        savingsLedger: { findUnique: jest.fn().mockResolvedValue({ id: 'l-1', balance: '0', principalBalance: '0' }) },
        savingsEntry: { create: jest.fn() },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.$transaction.mockImplementation((fn: (tx: any) => any) => fn(txCtx));
    });

    it('RBT01 — RBT_PRINCIPAL sans loanId → BadRequestException', async () => {
      await expect(
        service.recordEntry('sess-1', {
          membershipId: 'mem-1',
          type: TransactionType.RBT_PRINCIPAL,
          amount: 5000,
        }, 'actor'),
      ).rejects.toThrow(BadRequestException);
    });

    it('RBT02 — RBT_INTEREST sans loanId → BadRequestException', async () => {
      await expect(
        service.recordEntry('sess-1', {
          membershipId: 'mem-1',
          type: TransactionType.RBT_INTEREST,
          amount: 2000,
        }, 'actor'),
      ).rejects.toThrow(BadRequestException);
    });

    it('RBT03 — COTISATION sans loanId → succès (loanId non requis)', async () => {
      const result = await service.recordEntry('sess-1', {
        membershipId: 'mem-1',
        type: TransactionType.COTISATION,
        amount: 100000,
      }, 'actor');
      // createEntry via repository retourne { id: 'entry-1', ... }
      expect(result.id).toBeDefined();
    });
  });

  // ── updateEntry() ────────────────────────────────────────────────────────────

  describe('updateEntry()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txEntry: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txSession: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txSavingsEntry: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txSavingsLedger: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txRescueFundPosition: any;

    const makeEntry = (override: Record<string, unknown> = {}) => ({
      id: 'entry-1',
      sessionId: 'sess-1',
      membershipId: 'mem-1',
      type: TransactionType.COTISATION,
      amount: '50000',
      isOutOfSession: false,
      createdAt: new Date('2025-10-15'),
      ...override,
    });

    beforeEach(() => {
      txEntry = {
        findUnique: jest.fn().mockResolvedValue(makeEntry()),
        update: jest.fn().mockResolvedValue(makeEntry()),
      };
      txSession = {
        findUnique: jest.fn().mockResolvedValue(makeSession({ status: SessionStatus.OPEN })),
        update: jest.fn().mockResolvedValue({}),
      };
      txSavingsEntry = {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 'sv-1', createdAt: new Date('2025-10-15') }),
        findMany: jest.fn().mockResolvedValue([]),
      };
      txSavingsLedger = {
        findUnique: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
        update: jest.fn().mockResolvedValue({}),
      };
      txRescueFundPosition = {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.$transaction.mockImplementation((fn: (tx: any) => any) =>
        fn({
          sessionEntry: txEntry,
          monthlySession: txSession,
          savingsEntry: txSavingsEntry,
          savingsLedger: txSavingsLedger,
          rescueFundPosition: txRescueFundPosition,
          rescueFundLedger: { update: jest.fn() },
          membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      );
    });

    it('U01 — EPARGNE +10000 → savingsEntry.amount + balanceAfter incrémentés', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.EPARGNE, amount: '50000' }));
      txSavingsEntry.findFirst.mockResolvedValue({
        id: 'sv-1', ledgerId: 'ledger-1',
        createdAt: new Date('2025-10-15'),
      });

      await service.updateEntry('sess-1', 'entry-1', { amount: 60000 });

      expect(txSavingsEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { amount: { increment: 10000 }, balanceAfter: { increment: 10000 } },
        }),
      );
      expect(txSavingsLedger.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { increment: 10000 }, principalBalance: { increment: 10000 } },
        }),
      );
    });

    it('U02 — EPARGNE +diff → les SavingsEntry postérieures recalculées (chaîne balanceAfter)', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.EPARGNE, amount: '50000' }));
      const baseSavingsEntry = { id: 'sv-1', ledgerId: 'ledger-1', createdAt: new Date('2025-10-15') };
      txSavingsEntry.findFirst.mockResolvedValue(baseSavingsEntry);
      // 2 entrées postérieures
      txSavingsEntry.update.mockResolvedValue(baseSavingsEntry);
      txSavingsEntry.findMany.mockResolvedValue([
        { id: 'sv-2', createdAt: new Date('2025-11-01') },
        { id: 'sv-3', createdAt: new Date('2025-12-01') },
      ]);

      await service.updateEntry('sess-1', 'entry-1', { amount: 60000 });

      // 3 appels : sv-1 (l'entrée modifiée), sv-2, sv-3
      expect(txSavingsEntry.update).toHaveBeenCalledTimes(3);
    });

    it('U03 — notes seulement (diff=0) → monthlySession.update non appelé', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.COTISATION, amount: '50000' }));
      await service.updateEntry('sess-1', 'entry-1', { notes: 'correction' });
      expect(txSession.update).not.toHaveBeenCalled();
    });

    it('U04 — NotFoundException si entry absente', async () => {
      txEntry.findUnique.mockResolvedValue(null);
      await expect(service.updateEntry('sess-1', 'entry-x', {})).rejects.toThrow(NotFoundException);
    });

    it('U05 — NotFoundException si entry.sessionId ne correspond pas', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ sessionId: 'other-sess' }));
      await expect(service.updateEntry('sess-1', 'entry-1', { amount: 60000 })).rejects.toThrow(NotFoundException);
    });

    it('U06 — ConflictException si session CLOSED (entry normale)', async () => {
      txSession.findUnique.mockResolvedValue(makeSession({ status: SessionStatus.CLOSED }));
      await expect(service.updateEntry('sess-1', 'entry-1', { amount: 60000 })).rejects.toThrow(ConflictException);
    });

    it('U07 — entry hors-session (sessionId=null) autorisée même si session CLOSED', async () => {
      txEntry.findUnique.mockResolvedValue(
        makeEntry({ sessionId: null, isOutOfSession: true, type: TransactionType.COTISATION }),
      );
      txSession.findUnique.mockResolvedValue(makeSession({ status: SessionStatus.CLOSED }));
      // Ne doit pas lever ConflictException
      await expect(
        service.updateEntry('sess-1', 'entry-1', { amount: 60000 }),
      ).resolves.toBeDefined();
    });
  });

  // ── deleteEntry() ────────────────────────────────────────────────────────────

  describe('deleteEntry()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txEntry: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txSession: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txSavingsEntry: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txRescueFundPosition: any;

    const makeEntry = (override: Record<string, unknown> = {}) => ({
      id: 'entry-1',
      sessionId: 'sess-1',
      membershipId: 'mem-1',
      type: TransactionType.COTISATION,
      amount: '30000',
      isOutOfSession: false,
      ...override,
    });

    beforeEach(() => {
      txEntry = {
        findUnique: jest.fn().mockResolvedValue(makeEntry()),
        delete: jest.fn().mockResolvedValue({}),
      };
      txSession = {
        findUnique: jest.fn().mockResolvedValue(makeSession({ status: SessionStatus.OPEN })),
        update: jest.fn().mockResolvedValue({}),
      };
      txSavingsEntry = {
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue({}),
      };
      txRescueFundPosition = {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.$transaction.mockImplementation((fn: (tx: any) => any) =>
        fn({
          sessionEntry: txEntry,
          monthlySession: txSession,
          savingsEntry: txSavingsEntry,
          savingsLedger: { update: jest.fn() },
          rescueFundPosition: txRescueFundPosition,
          rescueFundLedger: { update: jest.fn() },
          membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      );
    });

    it('D01 — COTISATION → totalCotisation décrémenté + entry supprimée', async () => {
      await service.deleteEntry('sess-1', 'entry-1');
      expect(txSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { totalCotisation: { decrement: 30000 } } }),
      );
      expect(txEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
    });

    it('D02 — EPARGNE → savingsLedger décrémenté + savingsEntry supprimée', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.EPARGNE, amount: '40000' }));
      txSavingsEntry.findFirst.mockResolvedValue({ id: 'sv-1', ledgerId: 'ledger-1' });
      await service.deleteEntry('sess-1', 'entry-1');
      expect(txSavingsEntry.delete).toHaveBeenCalledWith({ where: { id: 'sv-1' } });
    });

    it('D03 — SECOURS → rescueFundPosition paidAmount/balance décrémentés, refillDebt incrémenté', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.SECOURS, amount: '15000' }));
      txRescueFundPosition.findUnique.mockResolvedValue({ id: 'pos-1', ledgerId: 'led-1', membershipId: 'mem-1' });
      await service.deleteEntry('sess-1', 'entry-1');
      expect(txRescueFundPosition.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { paidAmount: { decrement: 15000 }, balance: { decrement: 15000 }, refillDebt: { increment: 15000 } },
        }),
      );
    });

    it('D04 — retourne { success: true }', async () => {
      const result = await service.deleteEntry('sess-1', 'entry-1');
      expect(result).toEqual({ success: true });
    });

    it('D05 — NotFoundException si entry absente', async () => {
      txEntry.findUnique.mockResolvedValue(null);
      await expect(service.deleteEntry('sess-1', 'entry-x')).rejects.toThrow(NotFoundException);
    });

    it('D06 — ConflictException si session CLOSED (entry normale)', async () => {
      txSession.findUnique.mockResolvedValue(makeSession({ status: SessionStatus.CLOSED }));
      await expect(service.deleteEntry('sess-1', 'entry-1')).rejects.toThrow(ConflictException);
    });

    it('D07 — isOutOfSession=true → totalCotisation non décrémenté', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ isOutOfSession: true }));
      await service.deleteEntry('sess-1', 'entry-1');
      expect(txSession.update).not.toHaveBeenCalled();
    });
  });
});
