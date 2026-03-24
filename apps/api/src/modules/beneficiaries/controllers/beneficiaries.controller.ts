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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal-years/:fyId/beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Get('schedule')
  @ApiOperation({ summary: 'Tableau de rotation des bénéficiaires' })
  getSchedule(@Param('fyId') fyId: string) {
    return this.beneficiariesService.getSchedule(fyId);
  }

  @Post('slots/:slotId/assign')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT)
  @ApiOperation({ summary: 'Désigner un membre pour un slot (UNASSIGNED → ASSIGNED)' })
  assignSlot(
    @Param('slotId') slotId: string,
    @Body() dto: AssignSlotDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.beneficiariesService.assignSlot(slotId, dto, actorId);
  }

  @Patch('slots/:slotId/deliver')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Marquer comme livré (ASSIGNED → DELIVERED)' })
  markDelivered(
    @Param('slotId') slotId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.beneficiariesService.markDelivered(slotId, actorId);
  }
}
