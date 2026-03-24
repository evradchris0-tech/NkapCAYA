import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class RecordEntryDto {
  @ApiProperty({ description: 'Membership ID of the member' })
  @IsUUID()
  membershipId: string;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'Amount in XAF', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Loan ID (required for RBT_PRINCIPAL / RBT_INTEREST)' })
  @IsOptional()
  @IsUUID()
  loanId?: string;

  @ApiPropertyOptional({ description: 'True when entry is recorded outside of a session' })
  @IsOptional()
  @IsBoolean()
  isOutOfSession?: boolean;

  @ApiPropertyOptional({ description: 'External reference for out-of-session entry' })
  @IsOptional()
  @IsString()
  outOfSessionRef?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
