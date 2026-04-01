import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SavingsService } from '../services/savings.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('savings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get(':membershipId')
  @ApiOperation({ summary: 'Solde épargne + historique d\'un membre' })
  getBalance(@Param('membershipId') membershipId: string) {
    return this.savingsService.getBalance(membershipId);
  }

  @Post('distribute/:sessionId')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Distribuer les intérêts d\'une session (PRESIDENT)' })
  distributeInterests(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.savingsService.distributeInterests(sessionId, actorId);
  }
}
