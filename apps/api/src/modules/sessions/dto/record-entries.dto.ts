import { IsArray, IsString, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionEntryItemDto {
  @ApiProperty({ description: 'Membership ID' })
  @IsString()
  membershipId: string;

  @ApiProperty({ description: 'Entry type (SAVINGS, RESCUE_FUND, LOAN_REPAYMENT, etc.)' })
  @IsString()
  entryType: string;

  @ApiProperty({ description: 'Amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Notes or reference' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordEntriesDto {
  @ApiProperty({ type: [SessionEntryItemDto], description: 'List of session entries' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionEntryItemDto)
  entries: SessionEntryItemDto[];
}
