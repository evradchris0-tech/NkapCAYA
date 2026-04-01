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
        await this.sendWhatsApp(dto.recipientPhone, dto.message);
        break;
      default:
        throw new Error(`Canal non supporté : ${dto.channel}`);
    }
  }

  /**
   * Envoie un SMS via Africa's Talking.
   *
   * Variables d'environnement :
   *   AT_USERNAME   — username Africa's Talking ("sandbox" pour les tests)
   *   AT_API_KEY    — clé API Africa's Talking
   *   AT_SENDER_ID  — expéditeur alphanumérique optionnel
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    const apiKey = this.config.get<string>('AT_API_KEY');
    const username = this.config.get<string>('AT_USERNAME', 'sandbox');
    const senderId = this.config.get<string>('AT_SENDER_ID', '');

    if (!apiKey) {
      this.logger.warn(
        `[SMS DEV] → ${phone}\n${message}\n(Configurez AT_API_KEY pour envoyer de vrais SMS)`,
      );
      return;
    }

    const endpoint =
      username === 'sandbox'
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

      const text = await response.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        this.logger.error(`SMS échoué (${response.status}) : ${text.substring(0, 200)}`);
        return;
      }

      if (!response.ok) {
        this.logger.error(`SMS échoué (${response.status}) : ${JSON.stringify(data)}`);
        return;
      }

      this.logger.log(`SMS envoyé → ${phone}`);
    } catch (err) {
      this.logger.error(`Erreur envoi SMS → ${phone} : ${(err as Error).message}`);
    }
  }

  /**
   * Envoie un WhatsApp via Twilio Sandbox.
   *
   * Variables d'environnement requises :
   *   TWILIO_ACCOUNT_SID  — Account SID (commence par "AC...")
   *   TWILIO_AUTH_TOKEN   — Auth Token
   *   TWILIO_WA_FROM      — Numéro sandbox Twilio (ex: "whatsapp:+14155238886")
   *
   * Le destinataire doit avoir rejoint le sandbox en envoyant
   * le code "join <mot>" au numéro Twilio sandbox.
   */
  async sendWhatsApp(phone: string, message: string): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.config.get<string>('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886');

    if (!accountSid || !authToken) {
      this.logger.warn(
        `[WHATSAPP DEV] → ${phone}\n${message}\n(Configurez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN)`,
      );
      return;
    }

    // Normaliser le numéro au format WhatsApp Twilio
    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:+${phone.replace(/\D/g, '')}`;

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams({
      From: fromNumber,
      To: to,
      Body: message,
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const text = await response.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        this.logger.error(`WhatsApp échoué (${response.status}) : ${text.substring(0, 200)}`);
        return;
      }

      if (!response.ok) {
        this.logger.error(`WhatsApp échoué (${response.status}) : ${JSON.stringify(data)}`);
        return;
      }

      this.logger.log(`WhatsApp envoyé → ${phone} (sid: ${data['sid']})`);
    } catch (err) {
      this.logger.error(`Erreur envoi WhatsApp → ${phone} : ${(err as Error).message}`);
    }
  }

  /**
   * Envoie les identifiants de connexion à un nouveau membre.
   * Tente WhatsApp en priorité, repli sur SMS si non configuré.
   */
  async sendCredentials(phone: string, params: {
    firstName: string;
    memberCode: string;
    username: string;
    temporaryPassword: string;
  }): Promise<void> {
    const message =
      `Bienvenue dans CAYA, ${params.firstName} !\n\n` +
      `Code membre : *${params.memberCode}*\n` +
      `Identifiant : *${params.username}*\n` +
      `Mot de passe temporaire : *${params.temporaryPassword}*\n\n` +
      `Connectez-vous et changez votre mot de passe dès que possible.`;

    const twilioConfigured =
      this.config.get<string>('TWILIO_ACCOUNT_SID') &&
      this.config.get<string>('TWILIO_AUTH_TOKEN');

    if (twilioConfigured) {
      await this.sendWhatsApp(phone, message);
    } else {
      await this.sendSMS(phone, message);
    }
  }

  /** @deprecated Utiliser sendCredentials() à la place */
  async sendCredentialsSms(phone: string, params: {
    firstName: string;
    memberCode: string;
    username: string;
    temporaryPassword: string;
  }): Promise<void> {
    return this.sendCredentials(phone, params);
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
