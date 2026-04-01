import { Module } from '@nestjs/common';
import { SavingsController } from './controllers/savings.controller';
import { SavingsService } from './services/savings.service';
import { SavingsRepository } from './repositories/savings.repository';

@Module({
  controllers: [SavingsController],
  providers: [SavingsService, SavingsRepository],
  exports: [SavingsService],
})
export class SavingsModule {}
