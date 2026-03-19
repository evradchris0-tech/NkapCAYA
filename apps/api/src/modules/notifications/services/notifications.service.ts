import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async send(dto: SendNotificationDto): Promise<void> {
    switch (dto.channel) {
      case 'SMS':
        await this.sendSMS(dto.recipientPhone, dto.message);
        break;
      case 'WHATSAPP':
        await this.sendWhatsApp(dto.recipientPhone, dto.message, dto.templateId);
        break;
      default:
        throw new Error(`Canal non supporté : ${dto.channel}`);
    }
  }

  /**
   * Envoie un SMS via Africa's Talking (provider SMS leader en Afrique centrale).
   * En développement (AT_API_KEY absent), log le message dans la console.
   *
   * Variables d'environnement requises en production :
   *   AT_USERNAME   — votre username Africa's Talking (ex: "caya_tontine")
   *   AT_API_KEY    — votre clé API Africa's Talking
   *   AT_SENDER_ID  — expéditeur alphanumérique optionnel (ex: "CAYA")
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    const apiKey = this.config.get<string>('AT_API_KEY');
    const username = this.config.get<string>('AT_USERNAME', 'sandbox');
    const senderId = this.config.get<string>('AT_SENDER_ID', '');

    // ── Mode développement : log console ─────────────────────────────────────
    if (!apiKey) {
      this.logger.warn(
        `[SMS DEV] → ${phone}\n${message}\n(Configurez AT_API_KEY pour envoyer de vrais SMS)`,
      );
      return;
    }

    // ── Mode production : Africa's Talking HTTP API ───────────────────────────
    const endpoint = username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const params = new URLSearchParams({
      username,
      to: phone,
      message,
      ...(senderId && { from: senderId }),
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        this.logger.error(`SMS échoué (${response.status}) : ${JSON.stringify(data)}`);
        return;
      }

      this.logger.log(`SMS envoyé → ${phone}`);
    } catch (err) {
      // Ne pas faire échouer le flux métier si le SMS échoue
      this.logger.error(`Erreur envoi SMS → ${phone} : ${(err as Error).message}`);
    }
  }

  /**
   * Envoie les identifiants de connexion à un nouveau membre par SMS.
   */
  async sendCredentialsSms(phone: string, params: {
    firstName: string;
    memberCode: string;
    username: string;
    temporaryPassword: string;
  }): Promise<void> {
    const message =
      `Bienvenue dans CAYA, ${params.firstName}!\n` +
      `Votre code membre : ${params.memberCode}\n` +
      `Identifiant : ${params.username}\n` +
      `Mot de passe temporaire : ${params.temporaryPassword}\n` +
      `Connectez-vous et changez votre mot de passe dès que possible.`;

    await this.sendSMS(phone, message);
  }

  async sendWhatsApp(_phone: string, _message: string, _templateId?: string): Promise<void> {
    throw new Error('WhatsApp non implémenté');
  }

  async scheduleReminder(_dto: {
    recipientPhone: string;
    message: string;
    channel: string;
    scheduledAt: Date;
  }): Promise<void> {
    throw new Error('Not implemented');
  }

  async getTemplates() {
    throw new Error('Not implemented');
  }
}
