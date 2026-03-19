import { IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiPropertyOptional({ description: 'Monthly savings contribution amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlySavingsAmount?: number;

  @ApiPropertyOptional({ description: 'Monthly rescue fund contribution amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRescueContribution?: number;

  @ApiPropertyOptional({ description: 'Annual interest rate (percentage)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualInterestRate?: number;

  @ApiPropertyOptional({ description: 'Currency code (e.g. XAF)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Maximum loan multiplier relative to savings' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxLoanMultiplier?: number;

  @ApiPropertyOptional({ description: 'Cassation enabled flag' })
  @IsOptional()
  @IsBoolean()
  cassationEnabled?: boolean;
}
