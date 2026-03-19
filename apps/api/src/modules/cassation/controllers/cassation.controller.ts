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
import { BureauRole } from '@prisma/client';

@ApiTags('cassation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cassation')
export class CassationController {
  constructor(private readonly cassationService: CassationService) {}

  @Post(':fiscalYearId/execute')
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Execute cassation for a fiscal year' })
  executeCassation(@Param('fiscalYearId') fiscalYearId: string) {
    return this.cassationService.executeCassation(fiscalYearId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cassation record by ID' })
  findById(@Param('id') id: string) {
    return this.cassationService.findById(id);
  }
}
