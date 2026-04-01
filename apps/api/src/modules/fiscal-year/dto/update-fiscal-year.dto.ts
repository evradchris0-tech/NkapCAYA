import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFiscalYearDto {
  @ApiPropertyOptional({ description: 'Étiquette unique (ex: "2025-2026")', example: '2025-2026' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Date de cassation (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  cassationDate?: string;

  @ApiPropertyOptional({ description: 'Date limite remboursement prêts (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  loanDueDate?: string;

  @ApiPropertyOptional({ description: 'Notes libres' })
  @IsOptional()
  @IsString()
  notes?: string;
}
