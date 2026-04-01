import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEntryDto {
  @ApiPropertyOptional({ description: 'Nouveau montant (XAF)', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
