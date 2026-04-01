import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRescueEventAmountDto {
  @ApiProperty({ description: 'Nouveau montant du secours (XAF)', example: 300000 })
  @IsNumber()
  @Min(0)
  amount: number;
}
