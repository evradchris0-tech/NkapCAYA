import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from '../services/sessions.service';
import { RecordEntryDto } from '../dto/record-entry.dto';
import { UpdateEntryDto } from '../dto/update-entry.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une session + entries' })
  getSession(@Param('id') id: string) {
    return this.sessionsService.getSession(id);
  }

  @Post(':id/open')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'DRAFT → OPEN (SESS-04)' })
  openSession(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.sessionsService.openSession(id, actorId);
  }

  @Post(':id/reopen')
  @Roles(BureauRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'CLOSED → OPEN (M-03)' })
  reopenSession(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.sessionsService.reopenSession(id, actorId, reason);
  }

  @Post(':id/entries')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Enregistrer une transaction (SESS-01)' })
  recordEntry(
    @Param('id') id: string,
    @Body() dto: RecordEntryDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.sessionsService.recordEntry(id, dto, actorId);
  }

  @Patch(':id/entries/:entryId')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Modifier le montant / les notes d\'une transaction' })
  updateEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.sessionsService.updateEntry(id, entryId, dto);
  }

  @Delete(':id/entries/:entryId')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.TRESORIER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une transaction et annuler ses effets' })
  deleteEntry(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ) {
    return this.sessionsService.deleteEntry(id, entryId);
  }

  @Post(':id/close-review')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.VICE_PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'OPEN → REVIEWING' })
  closeForReview(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.sessionsService.closeForReview(id, actorId);
  }

  @Post(':id/validate')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'REVIEWING → CLOSED + distribution des intérêts' })
  validateAndClose(@Param('id') id: string, @CurrentUser('id') actorId: string) {
    return this.sessionsService.validateAndClose(id, actorId);
  }
}
