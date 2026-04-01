import { Module } from '@nestjs/common';
import { FiscalYearController } from './controllers/fiscal-year.controller';
import { FiscalYearService } from './services/fiscal-year.service';
import { FiscalYearRepository } from './repositories/fiscal-year.repository';
import { TontineConfigModule } from '../config/config.module';

@Module({
  imports: [TontineConfigModule],
  controllers: [FiscalYearController],
  providers: [FiscalYearService, FiscalYearRepository],
  exports: [FiscalYearService],
})
export class FiscalYearModule {}
