import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RescueFundService } from '../services/rescue-fund.service';
import { CreateRescueFundEventDto } from '../dto/create-rescue-fund-event.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('rescue-fund')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rescue-fund')
export class RescueFundController {
  constructor(private readonly rescueFundService: RescueFundService) {}

  @Get()
  @ApiOperation({ summary: 'Get rescue fund global balance' })
  getBalance() {
    return this.rescueFundService.getBalance();
  }

  @Post('events')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Record a rescue fund event (disbursement or contribution)' })
  recordEvent(@Body() dto: CreateRescueFundEventDto) {
    return this.rescueFundService.recordEvent(dto);
  }

  @Get('positions/:membershipId')
  @ApiOperation({ summary: 'Get rescue fund position for a membership' })
  getPositions(@Param('membershipId') membershipId: string) {
    return this.rescueFundService.getPositions(membershipId);
  }
}
