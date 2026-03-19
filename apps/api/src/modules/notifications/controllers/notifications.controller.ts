import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { BureauRole } from '@prisma/client';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Send a notification (internal use)' })
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Get('templates')
  @Roles(BureauRole.SUPER_ADMIN, BureauRole.PRESIDENT)
  @ApiOperation({ summary: 'Get available notification templates' })
  getTemplates() {
    return this.notificationsService.getTemplates();
  }
}
