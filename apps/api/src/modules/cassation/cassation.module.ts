import { Module } from '@nestjs/common';
import { CassationController } from './controllers/cassation.controller';
import { CassationService } from './services/cassation.service';
import { CassationRepository } from './repositories/cassation.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CassationController],
  providers: [CassationService, CassationRepository],
  exports: [CassationService],
})
export class CassationModule {}
