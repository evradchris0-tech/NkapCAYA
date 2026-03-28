import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MarkDeliveredDto {
  @ApiPropertyOptional({ description: 'Montant remis au bénéficiaire (optionnel)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
