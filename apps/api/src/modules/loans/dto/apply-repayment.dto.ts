import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyRepaymentDto {
  @ApiProperty({ description: 'Repayment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Session ID in which repayment is recorded' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Notes or reference' })
  @IsOptional()
  @IsString()
  notes?: string;
}
