import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyRepaymentDto {
  @ApiProperty({ description: 'Montant total du remboursement (principal + intérêts)', minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Session ID dans laquelle le remboursement est enregistré' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
