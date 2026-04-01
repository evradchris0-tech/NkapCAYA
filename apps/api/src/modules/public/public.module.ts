import { Module } from '@nestjs/common';
import { PublicController } from './controllers/public.controller';
import { PublicService } from './services/public.service';
import { PublicRepository } from './repositories/public.repository';

@Module({
  controllers: [PublicController],
  providers: [PublicService, PublicRepository],
})
export class PublicModule {}
