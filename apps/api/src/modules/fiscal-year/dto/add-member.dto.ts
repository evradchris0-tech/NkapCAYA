import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({ description: 'Member profile ID' })
  @IsString()
  memberId: string;

  @ApiPropertyOptional({ description: 'Number of shares committed' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sharesCommitted?: number;

  @ApiPropertyOptional({ description: 'Beneficiary order preference' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  beneficiaryOrder?: number;
}
