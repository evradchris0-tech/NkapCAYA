import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@database/prisma.service';

// version: VERSION_NEUTRAL → la route reste sur /health (pas de /v1) ;
// le préfixe global "api" est déjà exclu pour /health (cf. main.ts).
@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifie la disponibilité de l\'API et de la base de données' })
  async check() {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        db: 'error',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }

    return {
      status: 'ok',
      db: 'ok',
      latency_ms: Date.now() - start,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
