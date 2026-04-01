import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoansService } from '../services/loans.service';
import { RequestLoanDto } from '../dto/request-loan.dto';
import { ApplyRepaymentDto } from '../dto/apply-repayment.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @ApiOperation({ summary: 'Prêts d\'un membership (mobile) ou d\'un exercice (web)' })
  getMemberLoans(
    @Query('membershipId') membershipId: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    if (fiscalYearId) return this.loansService.getFiscalYearLoans(fiscalYearId);
    return this.loansService.getMemberLoans(membershipId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un prêt + accruals + remboursements' })
  getLoan(@Param('id') id: string) {
    return this.loansService.getLoan(id);
  }

  @Post('request')
  @ApiOperation({ summary: 'Demander un prêt (ouvert à tous les membres - M-01)' })
  requestLoan(@Body() dto: RequestLoanDto, @CurrentUser('id') actorId: string) {
    return this.loansService.requestLoan(dto, actorId);
  }

  @Patch(':id/approve')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Approuver un prêt (PENDING → ACTIVE)' })
  approveLoan(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.loansService.approveLoan(id, actorId);
  }

  @Post(':id/repay')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Enregistrer un remboursement' })
  applyRepayment(
    @Param('id') id: string,
    @Body() dto: ApplyRepaymentDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.loansService.applyRepayment(id, dto, actorId);
  }
}
