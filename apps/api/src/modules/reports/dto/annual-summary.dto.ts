import { ApiProperty } from '@nestjs/swagger';

export class AnnualSummaryDto {
  @ApiProperty({ description: 'Fiscal year label' })
  fiscalYearLabel: string;

  @ApiProperty({ description: 'Total members' })
  totalMembers: number;

  @ApiProperty({ description: 'Total savings collected' })
  totalSavings: number;

  @ApiProperty({ description: 'Total interests distributed' })
  totalInterests: number;

  @ApiProperty({ description: 'Total loans disbursed' })
  totalLoansDisbursed: number;

  @ApiProperty({ description: 'Total repayments collected' })
  totalRepaymentsCollected: number;

  @ApiProperty({ description: 'Rescue fund balance' })
  rescueFundBalance: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;
}
