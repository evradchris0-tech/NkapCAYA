import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CassationService } from '../services/cassation.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('cassation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal-years/:fyId/cassation')
export class CassationController {
  constructor(private readonly cassationService: CassationService) {}

  @Get()
  @ApiOperation({ summary: 'Résultat de la cassation + redistributions' })
  findByFiscalYear(@Param('fyId') fyId: string) {
    return this.cassationService.findByFiscalYear(fyId);
  }

  @Post('execute')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Lancer la cassation (CASSATION → CLOSED + redistributions)' })
  executeCassation(
    @Param('fyId') fyId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.cassationService.executeCassation(fyId, actorId);
  }
}
