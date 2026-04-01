import { Test, TestingModule } from '@nestjs/testing';
import { LoansController } from './loans.controller';
import { LoansService } from '../services/loans.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

const mockLoansService = {
  getMemberLoans: jest.fn().mockResolvedValue([]),
  getFiscalYearLoans: jest.fn().mockResolvedValue([]),
  getLoan: jest.fn().mockResolvedValue({ id: 'loan-1' }),
  requestLoan: jest.fn().mockResolvedValue({ id: 'loan-1' }),
  approveLoan: jest.fn().mockResolvedValue({ id: 'loan-1', status: 'ACTIVE' }),
  applyRepayment: jest.fn().mockResolvedValue({ id: 'repayment-1' }),
};

describe('LoansController', () => {
  let controller: LoansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [{ provide: LoansService, useValue: mockLoansService }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LoansController>(LoansController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('L01 — getMemberLoans avec fiscalYearId → getFiscalYearLoans', async () => {
    mockLoansService.getFiscalYearLoans.mockResolvedValue([{ id: 'loan-1' }]);
    const result = await controller.getMemberLoans('', 'fy-1');
    expect(mockLoansService.getFiscalYearLoans).toHaveBeenCalledWith('fy-1');
    expect(mockLoansService.getMemberLoans).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'loan-1' }]);
  });

  it('L02 — getMemberLoans sans fiscalYearId → getMemberLoans(membershipId)', async () => {
    mockLoansService.getMemberLoans.mockResolvedValue([{ id: 'loan-2' }]);
    const result = await controller.getMemberLoans('mem-1', '');
    expect(mockLoansService.getMemberLoans).toHaveBeenCalledWith('mem-1');
    expect(mockLoansService.getFiscalYearLoans).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'loan-2' }]);
  });

  it('L03 — approveLoan appelle loansService.approveLoan(id, actorId)', async () => {
    await controller.approveLoan('loan-1', 'actor-1');
    expect(mockLoansService.approveLoan).toHaveBeenCalledWith('loan-1', 'actor-1');
  });

  it('L04 — applyRepayment appelle loansService.applyRepayment(id, dto, actorId)', async () => {
    const dto = { amount: 10000, sessionId: 'sess-1' };
    await controller.applyRepayment('loan-1', dto, 'actor-1');
    expect(mockLoansService.applyRepayment).toHaveBeenCalledWith('loan-1', dto, 'actor-1');
  });
});
