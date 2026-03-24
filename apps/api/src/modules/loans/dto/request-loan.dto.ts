import { IsUUID, IsNumber, IsDateString, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestLoanDto {
  @ApiProperty({ description: 'Membership ID of the borrower' })
  @IsUUID()
  membershipId: string;

  @ApiProperty({ description: 'Requested loan amount in XAF', minimum: 10000 })
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiProperty({ description: 'Date limite de remboursement (ISO date)' })
  @IsDateString()
  dueBeforeDate: string;

  @ApiPropertyOptional({ description: 'Justification / objet du prêt' })
  @IsOptional()
  @IsString()
  requestNotes?: string;
}
