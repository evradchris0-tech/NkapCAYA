import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { ImportFiscalYearDto } from '../dto/import-fiscal-year.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('annual-summary')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Generate annual summary report' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'pdf', 'excel'] })
  generateAnnualSummary(
    @Query('fiscalYearId') fiscalYearId: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.generateAnnualSummary(fiscalYearId, format);
  }

  @Post('import-fiscal-year')
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Import a complete fiscal year from CAYABASE Excel data' })
  importFiscalYear(
    @Body() dto: ImportFiscalYearDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.reportsService.importFiscalYear(dto, actorId);
  }

  @Get('member/:id')
  @ApiOperation({ summary: 'Generate individual member report' })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'pdf', 'excel'] })
  generateMemberReport(
    @Param('id') memberId: string,
    @Query('fiscalYearId') fiscalYearId?: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.generateMemberReport(memberId, fiscalYearId, format);
  }

  @Get('session/:id')
  @ApiOperation({ summary: 'Generate session report' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'pdf', 'excel'] })
  generateSessionReport(
    @Param('id') sessionId: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.generateSessionReport(sessionId, format);
  }
}
