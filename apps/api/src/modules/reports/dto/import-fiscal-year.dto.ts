import {
  IsString,
  IsDateString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ── Per-member row in a session sheet ── */

export class ImportSessionEntryRow {
  @ApiProperty() @IsString()
  memberName: string;

  @ApiProperty() @IsNumber()
  inscription: number;

  @ApiProperty() @IsNumber()
  secours: number;

  @ApiProperty() @IsNumber()
  tontine: number;

  @ApiProperty() @IsNumber()
  pot: number;

  @ApiProperty() @IsNumber()
  remPret: number;

  @ApiProperty() @IsNumber()
  epargne: number;

  @ApiProperty() @IsNumber()
  pret: number;

  @ApiProperty() @IsNumber()
  projet: number;

  @ApiProperty() @IsNumber()
  autres: number;
}

/* ── One session (month) ── */

export class ImportSessionData {
  @ApiProperty() @IsNumber()
  sessionNumber: number;

  @ApiProperty({ type: [ImportSessionEntryRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSessionEntryRow)
  entries: ImportSessionEntryRow[];
}

/* ── ep+int sheet ── */

export class ImportSavingsRow {
  @ApiProperty() @IsString()
  memberName: string;

  @ApiProperty({ description: 'month → deposit amount' })
  @IsObject()
  deposits: Record<number, number>;

  @ApiProperty({ description: 'month → interest amount' })
  @IsObject()
  interests: Record<number, number>;

  @ApiProperty() @IsNumber()
  totalDeposit: number;

  @ApiProperty() @IsNumber()
  totalInterest: number;
}

/* ── prets sheet ── */

export class ImportLoanRow {
  @ApiProperty() @IsString()
  memberName: string;

  @ApiProperty({ description: 'month → disbursed amount' })
  @IsObject()
  disbursements: Record<number, number>;

  @ApiProperty() @IsNumber()
  totalInterest: number;

  @ApiProperty() @IsNumber()
  totalRepaid: number;

  @ApiProperty() @IsNumber()
  outstanding: number;
}

/* ── Rem sheet ── */

export class ImportRepaymentRow {
  @ApiProperty() @IsString()
  memberName: string;

  @ApiProperty({ description: 'month → repayment amount' })
  @IsObject()
  repayments: Record<number, number>;
}

/* ── intérêts sheet ── */

export class ImportInterestRow {
  @ApiProperty() @IsString()
  memberName: string;

  @ApiProperty({ description: 'month → interest accrued' })
  @IsObject()
  interests: Record<number, number>;
}

/* ── insc+sec sheet ── */

export class ImportRescueFundRow {
  @ApiProperty() @IsString()
  memberName: string;

  @ApiProperty() @IsNumber()
  inscription: number;

  @ApiProperty({ description: 'month → secours amount' })
  @IsObject()
  contributions: Record<number, number>;
}

/* ── Top-level payload ── */

export class ImportFiscalYearDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  label: string;

  @ApiProperty({ example: '2025-10-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Ordered member names', type: [String] })
  @IsArray()
  @IsString({ each: true })
  members: string[];

  @ApiProperty({ type: [ImportSavingsRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSavingsRow)
  savings: ImportSavingsRow[];

  @ApiProperty({ type: [ImportLoanRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportLoanRow)
  loans: ImportLoanRow[];

  @ApiProperty({ type: [ImportRepaymentRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRepaymentRow)
  repayments: ImportRepaymentRow[];

  @ApiProperty({ type: [ImportInterestRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportInterestRow)
  interests: ImportInterestRow[];

  @ApiProperty({ type: [ImportRescueFundRow] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRescueFundRow)
  rescueFund: ImportRescueFundRow[];

  @ApiProperty({ type: [ImportSessionData] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportSessionData)
  sessions: ImportSessionData[];
}
