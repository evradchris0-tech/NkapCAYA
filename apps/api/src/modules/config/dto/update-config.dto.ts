import { IsOptional, IsNumber, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  // Identité tontine
  @ApiPropertyOptional({ example: 'Club des Amis de Yaoundé' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'CAYA' })
  @IsOptional()
  @IsString()
  acronym?: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1900)
  foundedYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headquartersCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  // Parts
  @ApiPropertyOptional({ description: 'Montant d\'une part complète (XAF)', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shareUnitAmount?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  halfShareAmount?: number;

  @ApiPropertyOptional({ description: 'Contribution mensuelle pot (XAF)', example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  potMonthlyAmount?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  maxSharesPerMember?: number;

  // Épargne
  @ApiPropertyOptional({ description: 'Épargne initiale obligatoire (XAF)', example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mandatoryInitialSavings?: number;

  // Prêts
  @ApiPropertyOptional({ description: 'Taux mensuel prêt (ex: 0.04 = 4%/mois)', example: 0.04 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  loanMonthlyRate?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minLoanAmount?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxLoanAmount?: number;

  @ApiPropertyOptional({ description: 'Multiplicateur max prêt/épargne', example: 5 })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  maxLoanMultiplier?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSavingsToLoan?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  maxConcurrentLoans?: number;

  // Secours
  @ApiPropertyOptional({ description: 'Cible fonds de secours par membre (XAF)', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rescueFundTarget?: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rescueFundMinBalance?: number;

  // Inscription
  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFeeNew?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFeeReturning?: number;
}
