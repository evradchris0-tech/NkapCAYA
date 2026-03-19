import { Module } from '@nestjs/common';
import { LoansController } from './controllers/loans.controller';
import { LoansService } from './services/loans.service';
import { LoansRepository } from './repositories/loans.repository';

@Module({
  controllers: [LoansController],
  providers: [LoansService, LoansRepository],
  exports: [LoansService],
})
export class LoansModule {}
