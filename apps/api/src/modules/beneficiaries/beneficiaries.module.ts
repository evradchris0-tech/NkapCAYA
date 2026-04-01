import { Module } from '@nestjs/common';
import { BeneficiariesController } from './controllers/beneficiaries.controller';
import { BeneficiariesService } from './services/beneficiaries.service';
import { BeneficiariesRepository } from './repositories/beneficiaries.repository';

@Module({
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService, BeneficiariesRepository],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}
