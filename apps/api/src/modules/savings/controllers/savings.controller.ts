import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SavingsService } from '../services/savings.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('savings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get(':membershipId')
  @ApiOperation({ summary: 'Get savings balance for a membership' })
  getBalance(@Param('membershipId') membershipId: string) {
    return this.savingsService.getBalance(membershipId);
  }

  @Post('distribute/:sessionId')
  @Roles('SUPER_ADMIN', 'PRESIDENT')
  @ApiOperation({ summary: 'Distribute interests for a session' })
  distributeInterests(@Param('sessionId') sessionId: string) {
    return this.savingsService.distributeInterests(sessionId);
  }
}
