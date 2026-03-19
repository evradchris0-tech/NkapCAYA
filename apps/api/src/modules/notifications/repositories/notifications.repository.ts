import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async logNotification(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findTemplates() {
    throw new Error('Not implemented');
  }

  async findTemplateById(_id: string) {
    throw new Error('Not implemented');
  }

  async createScheduledReminder(_data: unknown) {
    throw new Error('Not implemented');
  }

  async findPendingReminders() {
    throw new Error('Not implemented');
  }

  async markReminderSent(_id: string) {
    throw new Error('Not implemented');
  }
}
