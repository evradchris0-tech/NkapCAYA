import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async send(dto: SendNotificationDto) {
    switch (dto.channel) {
      case 'WHATSAPP':
        return this.sendWhatsApp(dto.recipientPhone, dto.message, dto.templateId);
      case 'SMS':
        return this.sendSMS(dto.recipientPhone, dto.message);
      default:
        throw new Error('Not implemented');
    }
  }

  async sendWhatsApp(phone: string, message: string, templateId?: string) {
    throw new Error('Not implemented');
  }

  async sendSMS(phone: string, message: string) {
    throw new Error('Not implemented');
  }

  async scheduleReminder(dto: {
    recipientPhone: string;
    message: string;
    channel: string;
    scheduledAt: Date;
  }) {
    throw new Error('Not implemented');
  }

  async getTemplates() {
    throw new Error('Not implemented');
  }
}
