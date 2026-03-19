import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignSlotDto {
  @ApiProperty({ description: 'Membership ID to assign to the slot' })
  @IsString()
  membershipId: string;

  @ApiPropertyOptional({ description: 'Session ID for assignment' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Expected amount to be delivered' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedAmount?: number;
}
