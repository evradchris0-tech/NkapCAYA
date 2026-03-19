import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService as TontineConfigService } from '../services/config.service';
import { UpdateConfigDto } from '../dto/update-config.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: TontineConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get tontine configuration (singleton)' })
  findConfig() {
    return this.configService.findConfig();
  }

  @Patch()
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update tontine configuration (SUPER_ADMIN only)' })
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.configService.updateConfig(dto);
  }
}
