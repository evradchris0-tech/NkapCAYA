import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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
          provide: ConfigService,
          useValue: {
            // AT_API_KEY absent → mode dev (log console, pas d'appel HTTP)
            get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
              const values: Record<string, string> = { AT_USERNAME: 'sandbox' };
              return values[key] ?? defaultVal ?? undefined;
            }),
          },
        },
        {
          provide: NotificationsRepository,
          useValue: {
            logNotification: jest.fn(),
            findTemplates: jest.fn(),
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

  // ── sendSMS — mode dev (pas de AT_API_KEY) ───────────────────────────────

  describe('sendSMS()', () => {
    it('should log to console in dev mode (no AT_API_KEY)', async () => {
      // En mode dev, sendSMS doit résoudre sans lancer d'exception
      await expect(service.sendSMS('+237699000001', 'Test message')).resolves.toBeUndefined();
    });
  });

  // ── sendCredentialsSms ────────────────────────────────────────────────────

  describe('sendCredentialsSms()', () => {
    it('should compose and send credentials message', async () => {
      const spy = jest.spyOn(service, 'sendSMS').mockResolvedValue(undefined);

      await service.sendCredentialsSms('+237699000001', {
        firstName: 'Jean',
        memberCode: 'MB123456',
        username: '237699000001',
        temporaryPassword: 'Caya@MB123456',
      });

      expect(spy).toHaveBeenCalledWith(
        '+237699000001',
        expect.stringContaining('MB123456'),
      );
    });
  });

  // ── send() dispatch ───────────────────────────────────────────────────────

  describe('send()', () => {
    it('should dispatch SMS to sendSMS()', async () => {
      const spy = jest.spyOn(service, 'sendSMS').mockResolvedValue(undefined);

      await service.send({
        channel: NotificationChannel.SMS,
        recipientPhone: '+237699000001',
        message: 'Test dispatch',
      });

      expect(spy).toHaveBeenCalledWith('+237699000001', 'Test dispatch');
    });

    it('should throw for unsupported channel', async () => {
      await expect(
        service.send({
          channel: 'PIGEON' as NotificationChannel,
          recipientPhone: '+237699000001',
          message: 'Test',
        }),
      ).rejects.toThrow();
    });
  });

  // ── sendWhatsApp — dev mode (pas de credentials Twilio) ─────────────────

  describe('sendWhatsApp()', () => {
    it('should log and return in dev mode (no Twilio credentials)', async () => {
      await expect(service.sendWhatsApp('+237690000000', 'Test')).resolves.toBeUndefined();
    });
  });
});
