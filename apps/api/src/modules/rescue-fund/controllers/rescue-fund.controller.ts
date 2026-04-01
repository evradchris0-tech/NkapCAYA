import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RescueFundService } from '../services/rescue-fund.service';
import { CreateRescueFundEventDto } from '../dto/create-rescue-fund-event.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('rescue-fund')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal-years/:fyId/rescue-fund')
export class RescueFundController {
  constructor(private readonly rescueFundService: RescueFundService) {}

  @Get()
  @ApiOperation({ summary: 'Solde global + positions de la caisse de secours' })
  getLedger(@Param('fyId') fyId: string) {
    return this.rescueFundService.getLedger(fyId);
  }

  @Get('events')
  @ApiOperation({ summary: 'Historique des événements (décaissements)' })
  getEvents(@Param('fyId') fyId: string) {
    return this.rescueFundService.getEvents(fyId);
  }

  @Post('events')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT)
  @ApiOperation({ summary: 'Décaisser un secours (montant fixé en DB — RES-02)' })
  recordEvent(
    @Param('fyId') fyId: string,
    @Body() dto: CreateRescueFundEventDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.rescueFundService.recordEvent(fyId, dto, actorId);
  }
}
