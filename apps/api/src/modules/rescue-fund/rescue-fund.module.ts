import { Module } from '@nestjs/common';
import { RescueFundController } from './controllers/rescue-fund.controller';
import { RescueFundService } from './services/rescue-fund.service';
import { RescueFundRepository } from './repositories/rescue-fund.repository';

@Module({
  controllers: [RescueFundController],
  providers: [RescueFundService, RescueFundRepository],
  exports: [RescueFundService],
})
export class RescueFundModule {}
