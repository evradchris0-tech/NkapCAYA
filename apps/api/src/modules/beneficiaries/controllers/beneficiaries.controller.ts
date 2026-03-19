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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

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
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Assign a membership to a beneficiary slot' })
  assignSlot(@Param('id') id: string, @Body() dto: AssignSlotDto) {
    return this.beneficiariesService.assignSlot(id, dto);
  }

  @Patch('slots/:id/deliver')
  @Roles('SUPER_ADMIN', 'ADMIN', 'TREASURER')
  @ApiOperation({ summary: 'Mark a beneficiary slot as delivered' })
  markDelivered(@Param('id') id: string) {
    return this.beneficiariesService.markDelivered(id);
  }
}
