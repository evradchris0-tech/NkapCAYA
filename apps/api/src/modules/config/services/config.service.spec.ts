import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigRepository } from '../repositories/config.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: ConfigRepository, useValue: { findTontineConfig: jest.fn(), upsertTontineConfig: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findConfig()', () => {
    it('should return the tontine config singleton', async () => {
      await expect(service.findConfig()).rejects.toThrow('Not implemented');
    });
  });

  describe('updateConfig()', () => {
    it('should update the tontine config', async () => {
      await expect(service.updateConfig({})).rejects.toThrow('Not implemented');
    });
  });

  describe('snapshotForFiscalYear()', () => {
    it('should snapshot config for a fiscal year', async () => {
      await expect(service.snapshotForFiscalYear('fy-id')).rejects.toThrow('Not implemented');
    });
  });
});
