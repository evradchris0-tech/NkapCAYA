import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

export class SendNotificationDto {
  @ApiProperty({ enum: NotificationChannel, description: 'Notification channel' })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ description: 'Recipient phone number (E.164 format)' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ description: 'Message body' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Template ID (for WhatsApp templates)' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Member ID for tracking' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Schedule datetime (ISO 8601) for delayed sending' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
