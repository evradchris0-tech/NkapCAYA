import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FiscalYearService } from '../services/fiscal-year.service';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { AddMemberDto } from '../dto/add-member.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('fiscal-years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal-years')
export class FiscalYearController {
  constructor(private readonly fiscalYearService: FiscalYearService) {}

  @Post()
  @Roles(BureauRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un exercice fiscal (SUPER_ADMIN)' })
  create(@Body() dto: CreateFiscalYearDto, @CurrentUser() user: { id: string }) {
    return this.fiscalYearService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les exercices fiscaux' })
  findAll() {
    return this.fiscalYearService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un exercice fiscal' })
  findById(@Param('id') id: string) {
    return this.fiscalYearService.findById(id);
  }

  @Patch(':id/activate')
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activer un exercice fiscal PENDING → ACTIVE (SUPER_ADMIN)' })
  activate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.fiscalYearService.activate(id, user.id);
  }

  @Patch(':id/open-cassation')
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ouvrir la cassation ACTIVE → CASSATION (SUPER_ADMIN)' })
  openCassation(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.fiscalYearService.openCassation(id, user.id);
  }

  @Post(':id/members')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.SECRETAIRE_GENERAL, BureauRole.SECRETAIRE_ADJOINT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inscrire un membre à l\'exercice fiscal' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.fiscalYearService.addMember(id, dto, user.id);
  }

  @Get(':id/memberships')
  @ApiOperation({ summary: 'Lister les membres inscrits à l\'exercice' })
  getMemberships(@Param('id') id: string) {
    return this.fiscalYearService.getMemberships(id);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'Lister les 12 sessions mensuelles de l\'exercice' })
  getSessions(@Param('id') id: string) {
    return this.fiscalYearService.getSessions(id);
  }
}
