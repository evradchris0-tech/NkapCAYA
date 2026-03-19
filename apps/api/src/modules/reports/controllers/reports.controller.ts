import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('annual-summary')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Generate annual summary report' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'pdf', 'excel'] })
  generateAnnualSummary(
    @Query('fiscalYearId') fiscalYearId: string,
    @Query('format') format?: string,
  ) {
    return this.reportsService.generateAnnualSummary(fiscalYearId, format);
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
