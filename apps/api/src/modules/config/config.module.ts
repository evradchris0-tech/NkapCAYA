import { Module } from '@nestjs/common';
import { ConfigController } from './controllers/config.controller';
import { ConfigService as TontineConfigService } from './services/config.service';
import { ConfigRepository } from './repositories/config.repository';

@Module({
  controllers: [ConfigController],
  providers: [TontineConfigService, ConfigRepository],
  exports: [TontineConfigService],
})
export class TontineConfigModule {}
