import { Test, TestingModule } from '@nestjs/testing';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from '../repositories/sessions.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('SessionsService', () => {
  let service: SessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: SessionsRepository,
          useValue: {
            findById: jest.fn(),
            updateStatus: jest.fn(),
            createEntry: jest.fn(),
            findEntries: jest.fn(),
            createTransactionSequence: jest.fn(),
            getNextSequenceNumber: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openSession()', () => {
    it('should open a monthly session', async () => {
      await expect(service.openSession('session-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('recordEntries()', () => {
    it('should record entries for a session', async () => {
      await expect(service.recordEntries('session-id', { entries: [] })).rejects.toThrow('Not implemented');
    });
  });

  describe('closeSession()', () => {
    it('should close a session', async () => {
      await expect(service.closeSession('session-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('generateReference()', () => {
    it('should generate a transaction reference', async () => {
      await expect(service.generateReference('session-id', 'membership-id')).rejects.toThrow('Not implemented');
    });
  });
});
