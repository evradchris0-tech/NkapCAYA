import { ApiProperty } from '@nestjs/swagger';

export class CassationRecordDto {
  @ApiProperty({ description: 'Cassation record ID' })
  id: string;

  @ApiProperty({ description: 'Fiscal year ID' })
  fiscalYearId: string;

  @ApiProperty({ description: 'Total pool amount before cassation' })
  totalPoolAmount: number;

  @ApiProperty({ description: 'Cassation date' })
  executedAt: Date;

  @ApiProperty({ description: 'Status' })
  status: string;
}
