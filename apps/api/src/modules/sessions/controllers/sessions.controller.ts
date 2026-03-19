import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from '../services/sessions.service';
import { RecordEntriesDto } from '../dto/record-entries.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post(':id/open')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Open a monthly session' })
  openSession(@Param('id') id: string) {
    return this.sessionsService.openSession(id);
  }

  @Post(':id/entries')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT, BureauRole.TRESORIER)
  @ApiOperation({ summary: 'Record entries for a session' })
  recordEntries(@Param('id') id: string, @Body() dto: RecordEntriesDto) {
    return this.sessionsService.recordEntries(id, dto);
  }

  @Post(':id/close')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Close a monthly session' })
  closeSession(@Param('id') id: string) {
    return this.sessionsService.closeSession(id);
  }
}
