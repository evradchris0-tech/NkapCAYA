import { Module } from '@nestjs/common';
import { MembersController } from './controllers/members.controller';
import { MembersService } from './services/members.service';
import { MembersRepository } from './repositories/members.repository';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MembersController],
  providers: [MembersService, MembersRepository],
  exports: [MembersService, MembersRepository],
})
export class MembersModule {}
