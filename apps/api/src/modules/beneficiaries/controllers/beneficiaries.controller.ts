import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BeneficiariesService } from '../services/beneficiaries.service';
import { AssignSlotDto } from '../dto/assign-slot.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Get(':fiscalYearId')
  @ApiOperation({ summary: 'Get beneficiary schedule for a fiscal year' })
  getSchedule(@Param('fiscalYearId') fiscalYearId: string) {
    return this.beneficiariesService.getSchedule(fiscalYearId);
  }

  @Post('slots/:id/assign')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Assign a membership to a beneficiary slot' })
  assignSlot(@Param('id') id: string, @Body() dto: AssignSlotDto) {
    return this.beneficiariesService.assignSlot(id, dto);
  }

  @Patch('slots/:id/deliver')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Mark a beneficiary slot as delivered' })
  markDelivered(@Param('id') id: string) {
    return this.beneficiariesService.markDelivered(id);
  }
}
