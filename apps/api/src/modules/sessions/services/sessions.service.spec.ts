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
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    prisma = {
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
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if previous session is not CLOSED (SESS-04)', async () => {
      repository.findById.mockResolvedValue(makeSession({ sessionNumber: 2 }) as any);
      repository.findPreviousSession.mockResolvedValue(
        makeSession({ sessionNumber: 1, status: SessionStatus.OPEN }) as any,
      );
      await expect(service.openSession('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });

    it('should succeed when previous session is CLOSED', async () => {
      repository.findById.mockResolvedValue(makeSession({ sessionNumber: 2 }) as any);
      repository.findPreviousSession.mockResolvedValue(
        makeSession({ sessionNumber: 1, status: SessionStatus.CLOSED }) as any,
      );
      const result = await service.openSession('sess-1', 'actor');
      expect(result.status).toBe(SessionStatus.OPEN);
    });
  });

  describe('closeForReview()', () => {
    it('should transition OPEN → REVIEWING', async () => {
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await service.closeForReview('sess-1', 'actor');
      expect(repository.updateStatus).toHaveBeenCalledWith(
        'sess-1',
        SessionStatus.REVIEWING,
        expect.objectContaining({ closedById: 'actor' }),
      );
    });

    it('should throw ConflictException if not OPEN', async () => {
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.DRAFT }) as any);
      await expect(service.closeForReview('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });

  describe('validateAndClose()', () => {
    it('should transition REVIEWING → CLOSED', async () => {
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
      repository.findById.mockResolvedValue(makeSession({ status: SessionStatus.OPEN }) as any);
      await expect(service.validateAndClose('sess-1', 'actor')).rejects.toThrow(ConflictException);
    });
  });
});
