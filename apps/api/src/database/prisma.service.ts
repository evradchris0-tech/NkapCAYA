import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Connexion résiliente. Sur hébergement contraint (throttle CPU type CageFS/LVE),
    // le moteur Prisma peut paniquer au démarrage ("PANIC: timer has gone away").
    // On réessaie quelques fois ; en dernier recours on NE crashe PAS — la connexion
    // se fera paresseusement à la 1ère requête. Évite le crash-loop au boot.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connecté.');
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Connexion Prisma échouée (tentative ${attempt}/3) : ${msg}`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    this.logger.warn(
      'Connexion Prisma eager abandonnée — bascule en connexion paresseuse (à la 1ère requête).',
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect().catch(() => undefined);
  }
}
