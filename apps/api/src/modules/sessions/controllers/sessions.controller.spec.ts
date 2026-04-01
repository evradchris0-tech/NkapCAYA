import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from '../services/sessions.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

const mockSessionsService = {
  getSession: jest.fn().mockResolvedValue({ id: 'sess-1' }),
  openSession: jest.fn().mockResolvedValue({ id: 'sess-1', status: 'OPEN' }),
  reopenSession: jest.fn().mockResolvedValue({ id: 'sess-1', status: 'OPEN' }),
  recordEntry: jest.fn().mockResolvedValue({ id: 'entry-1' }),
  updateEntry: jest.fn().mockResolvedValue({ id: 'entry-1', amount: 60000 }),
  deleteEntry: jest.fn().mockResolvedValue({ success: true }),
  closeForReview: jest.fn().mockResolvedValue({ id: 'sess-1', status: 'REVIEWING' }),
  validateAndClose: jest.fn().mockResolvedValue({ id: 'sess-1', status: 'CLOSED' }),
};

describe('SessionsController', () => {
  let controller: SessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [{ provide: SessionsService, useValue: mockSessionsService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('C01 — getSession appelle sessionsService.getSession(id)', async () => {
    mockSessionsService.getSession.mockResolvedValue({ id: 'sess-1' });
    const result = await controller.getSession('sess-1');
    expect(mockSessionsService.getSession).toHaveBeenCalledWith('sess-1');
    expect(result).toEqual({ id: 'sess-1' });
  });

  it('C02 — openSession appelle sessionsService.openSession(id, actorId)', async () => {
    await controller.openSession('sess-1', 'actor-1');
    expect(mockSessionsService.openSession).toHaveBeenCalledWith('sess-1', 'actor-1');
  });

  it('C03 — updateEntry appelle sessionsService.updateEntry(id, entryId, dto)', async () => {
    const dto = { amount: 60000 };
    await controller.updateEntry('sess-1', 'entry-1', dto);
    expect(mockSessionsService.updateEntry).toHaveBeenCalledWith('sess-1', 'entry-1', dto);
  });

  it('C04 — deleteEntry appelle sessionsService.deleteEntry(id, entryId)', async () => {
    const result = await controller.deleteEntry('sess-1', 'entry-1');
    expect(mockSessionsService.deleteEntry).toHaveBeenCalledWith('sess-1', 'entry-1');
    expect(result).toEqual({ success: true });
  });

  it('C05 — validateAndClose appelle sessionsService.validateAndClose(id, actorId)', async () => {
    await controller.validateAndClose('sess-1', 'actor-1');
    expect(mockSessionsService.validateAndClose).toHaveBeenCalledWith('sess-1', 'actor-1');
  });
});
