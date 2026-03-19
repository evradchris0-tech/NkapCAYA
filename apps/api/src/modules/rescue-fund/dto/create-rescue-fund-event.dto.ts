import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RescueFundEventType {
  CONTRIBUTION = 'CONTRIBUTION',
  DISBURSEMENT = 'DISBURSEMENT',
  REIMBURSEMENT = 'REIMBURSEMENT',
}

export class CreateRescueFundEventDto {
  @ApiProperty({ enum: RescueFundEventType, description: 'Type of rescue fund event' })
  @IsEnum(RescueFundEventType)
  eventType: RescueFundEventType;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Membership ID concerned' })
  @IsString()
  membershipId: string;

  @ApiPropertyOptional({ description: 'Beneficiary name (for disbursements)' })
  @IsOptional()
  @IsString()
  beneficiaryName?: string;

  @ApiPropertyOptional({ description: 'Reason for the event' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
