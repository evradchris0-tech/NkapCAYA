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
import { FiscalYearService } from '../services/fiscal-year.service';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { AddMemberDto } from '../dto/add-member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('fiscal-years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal-years')
export class FiscalYearController {
  constructor(private readonly fiscalYearService: FiscalYearService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a new fiscal year' })
  create(@Body() dto: CreateFiscalYearDto) {
    return this.fiscalYearService.create(dto);
  }

  @Patch(':id/activate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Activate a fiscal year' })
  activate(@Param('id') id: string) {
    return this.fiscalYearService.activate(id);
  }

  @Post(':id/members')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add a member to a fiscal year' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.fiscalYearService.addMember(id, dto);
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: 'Get all memberships for a fiscal year' })
  getMemberships(@Param('id') id: string) {
    return this.fiscalYearService.getMemberships(id);
  }
}
