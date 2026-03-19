import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LoansService } from '../services/loans.service';
import { RequestLoanDto } from '../dto/request-loan.dto';
import { ApplyRepaymentDto } from '../dto/apply-repayment.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request a loan' })
  requestLoan(@Body() dto: RequestLoanDto) {
    return this.loansService.requestLoan(dto);
  }

  @Patch(':id/disburse')
  @Roles('SUPER_ADMIN', 'PRESIDENT', 'TRESORIER')
  @ApiOperation({ summary: 'Disburse an approved loan' })
  disburse(@Param('id') id: string) {
    return this.loansService.disburse(id);
  }

  @Post(':id/repay')
  @Roles('SUPER_ADMIN', 'PRESIDENT', 'TRESORIER')
  @ApiOperation({ summary: 'Apply a repayment to a loan' })
  applyRepayment(@Param('id') id: string, @Body() dto: ApplyRepaymentDto) {
    return this.loansService.applyRepayment(id, dto);
  }
}
