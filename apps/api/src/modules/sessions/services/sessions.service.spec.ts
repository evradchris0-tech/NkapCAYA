import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { SessionStatus, TransactionType } from '@prisma/client';

const makeFiscalYear = () => ({
  id: 'fy-1',
  startDate: new Date('2025-10-01'),
  config: { interestPoolMethod: 'THEORETICAL', shareUnitAmount: '100000' },
});

const makeSession = (override = {}) => ({
  id: 'sess-1',
  fiscalYearId: 'fy-1',
  sessionNumber: 1,
  status: SessionStatus.DRAFT,
  fiscalYear: makeFiscalYear(),
  entries: [],
  ...override,
});

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: jest.Mocked<SessionsRepository>;
  let prisma: { $transaction: jest.Mock; monthlySession?: { findFirst: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      monthlySession: { findFirst: jest.fn().mockResolvedValue(null) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: jest.fn().mockImplementation((fn: (tx: any) => any) => fn({
        monthlySession: { findUnique: jest.fn().mockResolvedValue(makeSession()) },
        membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
        sessionEntry: { findMany: jest.fn().mockResolvedValue([]) },
        monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
        savingsLedger: { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
        savingsEntry: { create: jest.fn() },
        poolParticipant: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
        interestDistributionSnapshot: { create: jest.fn().mockResolvedValue({ id: 'snap-1' }) },
        interestAllocation: { create: jest.fn() },
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
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get(SessionsRepository);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('openSession()', () => {
    it('should open a DRAFT session (session 1, no previous required)', async () => {
      const result = await service.openSession('sess-1', 'actor-id');
      expect(result.status).toBe(SessionStatus.OPEN);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'sess-1',
        SessionStatus.OPEN,
        expect.objectContaining({ openedById: 'actor-id' }),
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.openSession('x', 'actor')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if session is not DRAFT', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if previous session is not CLOSED (SESS-04)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ sessionNumber: 2 }) as any);
      repository.findPreviousSession.mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeSession({ sessionNumber: 1, status: SessionStatus.OPEN }) as any,
      );
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('should succeed when previous session is CLOSED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ sessionNumber: 2 }) as any);
      repository.findPreviousSession.mockResolvedValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        makeSession({ sessionNumber: 1, status: SessionStatus.CLOSED }) as any,
      );
      const result = await service.openSession('sess-1', 'actor');
      expect(result.status).toBe(SessionStatus.OPEN);
    });
  });

  describe('closeForReview()', () => {
    it('should transition OPEN → REVIEWING', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await service.closeForReview('sess-1', 'actor');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'sess-1',
        SessionStatus.REVIEWING,
        expect.objectContaining({ closedById: 'actor' }),
      );
    });

    it('should throw ConflictException if not OPEN', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.DRAFT }) as any);
      await expect(service.closeForReview('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });

  describe('validateAndClose()', () => {
    it('should transition REVIEWING → CLOSED', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.REVIEWING }) as any);
      await service.validateAndClose('sess-1', 'actor');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'sess-1',
        SessionStatus.CLOSED,
        expect.objectContaining({ closedById: 'actor' }),
        expect.anything(), // tx from outer $transaction
      );
    });

    it('should throw ConflictException if not REVIEWING', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await expect(service.validateAndClose('sess-1', 'actor')).rejects.toThrow(ConflictException);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txRescueFundLedger: any;

    const makeEntry = (override: Record<string, unknown> = {}) => ({
      id: 'entry-1',
      sessionId: 'sess-1',
      membershipId: 'mem-1',
      type: TransactionType.COTISATION,
      amount: '50000',
      isOutOfSession: false,
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
        update: jest.fn().mockResolvedValue({}),
      };
      txSavingsLedger = {
        findUnique: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
        update: jest.fn().mockResolvedValue({}),
      };
      txRescueFundPosition = {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      };
      txRescueFundLedger = {
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
          rescueFundLedger: txRescueFundLedger,
          membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      );
    });

    it('U01 — EPARGNE, montant augmenté de 10000 → savingsEntry + savingsLedger incrémentés', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.EPARGNE, amount: '50000' }));
      txSavingsEntry.findFirst.mockResolvedValue({ id: 'sv-1', ledgerId: 'ledger-1', amount: '50000' });

      await service.updateEntry('sess-1', 'entry-1', { amount: 60000 });

      expect(txSavingsEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { amount: { increment: 10000 }, balanceAfter: { increment: 10000 } } }),
      );
      expect(txSavingsLedger.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { balance: { increment: 10000 }, principalBalance: { increment: 10000 } } }),
      );
    });

    it('U02 — SECOURS, montant réduit de 5000 → rescueFundPosition mis à jour', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.SECOURS, amount: '50000' }));
      txRescueFundPosition.findUnique.mockResolvedValue({
        id: 'pos-1',
        ledgerId: 'led-1',
        paidAmount: '50000',
        balance: '50000',
        refillDebt: '0',
        membershipId: 'mem-1',
      });

      await service.updateEntry('sess-1', 'entry-1', { amount: 45000 });

      expect(txRescueFundPosition.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmount: { increment: -5000 },
            balance: { increment: -5000 },
          }),
        }),
      );
    });

    it('U03 — notes seulement (diff=0) → monthlySession.update non appelé', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.COTISATION, amount: '50000' }));

      await service.updateEntry('sess-1', 'entry-1', { notes: 'correction' });

      expect(txSession.update).not.toHaveBeenCalled();
      expect(txEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { notes: 'correction' } }),
      );
    });

    it('U04 — NotFoundException si entryId absent', async () => {
      txEntry.findUnique.mockResolvedValue(null);
      await expect(service.updateEntry('sess-1', 'entry-x', {})).rejects.toThrow(NotFoundException);
    });

    it('U05 — NotFoundException si entry.sessionId ne correspond pas', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ sessionId: 'other-sess' }));
      await expect(service.updateEntry('sess-1', 'entry-1', { amount: 60000 })).rejects.toThrow(NotFoundException);
    });

    it('U06 — ConflictException si session CLOSED', async () => {
      txSession.findUnique.mockResolvedValue(makeSession({ status: SessionStatus.CLOSED }));
      await expect(service.updateEntry('sess-1', 'entry-1', { amount: 60000 })).rejects.toThrow(ConflictException);
    });

    it('U07 — EPARGNE sans savingsEntry lié → savingsLedger.update non appelé', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.EPARGNE, amount: '50000' }));
      txSavingsEntry.findFirst.mockResolvedValue(null);

      await service.updateEntry('sess-1', 'entry-1', { amount: 60000 });

      expect(txSavingsLedger.update).not.toHaveBeenCalled();
      expect(txSavingsEntry.update).not.toHaveBeenCalled();
    });

    it('U08 — montant inchangé, COTISATION → monthlySession.update non appelé', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.COTISATION, amount: '50000' }));

      await service.updateEntry('sess-1', 'entry-1', { amount: 50000 });

      expect(txSession.update).not.toHaveBeenCalled();
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
    let txSavingsLedger: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txRescueFundPosition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let txRescueFundLedger: any;

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
      txSavingsLedger = {
        update: jest.fn().mockResolvedValue({}),
      };
      txRescueFundPosition = {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      };
      txRescueFundLedger = {
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
          rescueFundLedger: txRescueFundLedger,
          membership: { findFirst: jest.fn().mockResolvedValue({ id: 'mem-1' }) },
          monthlyLoanAccrual: { findMany: jest.fn().mockResolvedValue([]) },
        }),
      );
    });

    it('D01 — COTISATION → monthlySession.update décrémente totalCotisation', async () => {
      await service.deleteEntry('sess-1', 'entry-1');

      expect(txSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { totalCotisation: { decrement: 30000 } },
        }),
      );
      expect(txEntry.delete).toHaveBeenCalledWith({ where: { id: 'entry-1' } });
    });

    it('D02 — EPARGNE → savingsLedger décrémenté + savingsEntry supprimé', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.EPARGNE, amount: '40000' }));
      txSavingsEntry.findFirst.mockResolvedValue({ id: 'sv-1', ledgerId: 'ledger-1' });

      await service.deleteEntry('sess-1', 'entry-1');

      expect(txSavingsLedger.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { balance: { decrement: 40000 }, principalBalance: { decrement: 40000 } },
        }),
      );
      expect(txSavingsEntry.delete).toHaveBeenCalledWith({ where: { id: 'sv-1' } });
    });

    it('D03 — SECOURS → rescueFundPosition annulée (paidAmount, balance décrémentés, refillDebt incrémenté)', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.SECOURS, amount: '15000' }));
      txRescueFundPosition.findUnique.mockResolvedValue({ id: 'pos-1', ledgerId: 'led-1', membershipId: 'mem-1' });

      await service.deleteEntry('sess-1', 'entry-1');

      expect(txRescueFundPosition.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { paidAmount: { decrement: 15000 }, balance: { decrement: 15000 }, refillDebt: { increment: 15000 } },
        }),
      );
      expect(txRescueFundLedger.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { totalBalance: { decrement: 15000 } } }),
      );
    });

    it('D04 — retourne { success: true }', async () => {
      const result = await service.deleteEntry('sess-1', 'entry-1');
      expect(result).toEqual({ success: true });
    });

    it('D05 — NotFoundException si entry absent', async () => {
      txEntry.findUnique.mockResolvedValue(null);
      await expect(service.deleteEntry('sess-1', 'entry-x')).rejects.toThrow(NotFoundException);
    });

    it('D06 — ConflictException si session CLOSED', async () => {
      txSession.findUnique.mockResolvedValue(makeSession({ status: SessionStatus.CLOSED }));
      await expect(service.deleteEntry('sess-1', 'entry-1')).rejects.toThrow(ConflictException);
    });

    it('D07 — isOutOfSession=true → monthlySession.update non appelé pour les totaux', async () => {
      txEntry.findUnique.mockResolvedValue(makeEntry({ type: TransactionType.COTISATION, isOutOfSession: true }));

      await service.deleteEntry('sess-1', 'entry-1');

      expect(txSession.update).not.toHaveBeenCalled();
      expect(txEntry.delete).toHaveBeenCalled();
    });
  });
});
