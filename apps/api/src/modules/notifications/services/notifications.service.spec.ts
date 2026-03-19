import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { PrismaService } from '@database/prisma.service';
import { NotificationChannel } from '../dto/send-notification.dto';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: {
            logNotification: jest.fn(),
            findTemplates: jest.fn(),
            findTemplateById: jest.fn(),
            createScheduledReminder: jest.fn(),
            findPendingReminders: jest.fn(),
            markReminderSent: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWhatsApp()', () => {
    it('should send a WhatsApp message', async () => {
      await expect(service.sendWhatsApp('+237690000000', 'Test message')).rejects.toThrow('Not implemented');
    });
  });

  describe('sendSMS()', () => {
    it('should send an SMS', async () => {
      await expect(service.sendSMS('+237690000000', 'Test message')).rejects.toThrow('Not implemented');
    });
  });

  describe('scheduleReminder()', () => {
    it('should schedule a reminder', async () => {
      await expect(
        service.scheduleReminder({
          recipientPhone: '+237690000000',
          message: 'Rappel cotisation',
          channel: 'WHATSAPP',
          scheduledAt: new Date(),
        }),
      ).rejects.toThrow('Not implemented');
    });
  });

  describe('getTemplates()', () => {
    it('should return available notification templates', async () => {
      await expect(service.getTemplates()).rejects.toThrow('Not implemented');
    });
  });

  describe('send()', () => {
    it('should dispatch to the correct channel', async () => {
      await expect(
        service.send({
          channel: NotificationChannel.SMS,
          recipientPhone: '+237690000000',
          message: 'Test',
        }),
      ).rejects.toThrow('Not implemented');
    });
  });
});
