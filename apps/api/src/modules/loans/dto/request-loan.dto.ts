import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestLoanDto {
  @ApiProperty({ description: 'Membership ID of the borrower' })
  @IsString()
  membershipId: string;

  @ApiProperty({ description: 'Requested loan amount' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Repayment duration in months' })
  @IsNumber()
  @Min(1)
  durationMonths: number;

  @ApiPropertyOptional({ description: 'Purpose of the loan' })
  @IsOptional()
  @IsString()
  purpose?: string;
}
