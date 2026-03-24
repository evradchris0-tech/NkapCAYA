import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService as TontineConfigService } from '../services/config.service';
import { UpdateConfigDto } from '../dto/update-config.dto';
import { UpdateRescueEventAmountDto } from '../dto/update-rescue-event-amount.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole, RescueEventType } from '@prisma/client';

@ApiTags('config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: TontineConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Lire la configuration de la tontine (singleton)' })
  findConfig() {
    return this.configService.findConfig();
  }

  @Patch()
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier la configuration (SUPER_ADMIN — exercice non ACTIVE)' })
  updateConfig(@Body() dto: UpdateConfigDto, @CurrentUser() user: { id: string }) {
    return this.configService.updateConfig(dto, user.id);
  }

  @Get('rescue-events')
  @ApiOperation({ summary: 'Lister les montants par type d\'événement secours' })
  findRescueEventAmounts() {
    return this.configService.findRescueEventAmounts();
  }

  @Patch('rescue-events/:eventType')
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier le montant d\'un événement secours (SUPER_ADMIN)' })
  updateRescueEventAmount(
    @Param('eventType') eventType: RescueEventType,
    @Body() dto: UpdateRescueEventAmountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.configService.updateRescueEventAmount(eventType, dto.amount, user.id);
  }
}
