import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async logNotification(data: any) {
    throw new Error('Not implemented');
  }

  async findTemplates() {
    throw new Error('Not implemented');
  }

  async findTemplateById(id: string) {
    throw new Error('Not implemented');
  }

  async createScheduledReminder(data: any) {
    throw new Error('Not implemented');
  }

  async findPendingReminders() {
    throw new Error('Not implemented');
  }

  async markReminderSent(id: string) {
    throw new Error('Not implemented');
  }
}
