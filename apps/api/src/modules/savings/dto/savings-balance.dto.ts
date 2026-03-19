import { ApiProperty } from '@nestjs/swagger';

export class SavingsBalanceDto {
  @ApiProperty({ description: 'Membership ID' })
  membershipId: string;

  @ApiProperty({ description: 'Total savings balance' })
  balance: number;

  @ApiProperty({ description: 'Total interest earned' })
  totalInterest: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;
}
