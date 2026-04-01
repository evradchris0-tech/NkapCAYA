import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from '../services/beneficiaries.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { BeneficiaryStatus } from '@prisma/client';

const mockBeneficiariesService = {
  getSchedule: jest.fn().mockResolvedValue({ id: 'sched-1', slots: [] }),
  assignSlot: jest.fn().mockResolvedValue({ id: 'slot-1', status: BeneficiaryStatus.ASSIGNED }),
  markDelivered: jest.fn().mockResolvedValue({ id: 'slot-1', status: BeneficiaryStatus.DELIVERED }),
  setHost: jest.fn().mockResolvedValue({ id: 'slot-1', isHost: true }),
  addSlotToSession: jest.fn().mockResolvedValue({ id: 'slot-2', status: BeneficiaryStatus.UNASSIGNED }),
  removeSlot: jest.fn().mockResolvedValue({ success: true }),
};

describe('BeneficiariesController', () => {
  let controller: BeneficiariesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeneficiariesController],
      providers: [{ provide: BeneficiariesService, useValue: mockBeneficiariesService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BeneficiariesController>(BeneficiariesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('B01 — assignSlot appelle beneficiariesService.assignSlot(slotId, dto, actorId)', async () => {
    const dto = { membershipId: 'mem-1' };
    await controller.assignSlot('slot-1', dto as any, 'actor-1');
    expect(mockBeneficiariesService.assignSlot).toHaveBeenCalledWith('slot-1', dto, 'actor-1');
  });

  it('B02 — markDelivered appelle beneficiariesService.markDelivered(slotId, actorId, dto)', async () => {
    const dto = { amount: 500000 };
    await controller.markDelivered('slot-1', dto as any, 'actor-1');
    expect(mockBeneficiariesService.markDelivered).toHaveBeenCalledWith('slot-1', 'actor-1', dto);
  });

  it('B03 — addSlotToSession extrait fyId et sessionId depuis les paramètres de route', async () => {
    await controller.addSlotToSession('fy-1', 'sess-1');
    expect(mockBeneficiariesService.addSlotToSession).toHaveBeenCalledWith('sess-1', 'fy-1');
  });
});
