import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFiscalYearDto {
  @ApiProperty({ description: 'Étiquette unique (ex: "2025-2026")', example: '2025-2026' })
  @IsString()
  label: string;

  @ApiProperty({ description: 'Date de début (ISO 8601)', example: '2025-10-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Date de fin (ISO 8601)', example: '2026-09-30' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Date de cassation (ISO 8601)', example: '2026-08-31' })
  @IsDateString()
  cassationDate: string;

  @ApiProperty({ description: 'Date limite remboursement prêts (ISO 8601)', example: '2026-06-30' })
  @IsDateString()
  loanDueDate: string;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
