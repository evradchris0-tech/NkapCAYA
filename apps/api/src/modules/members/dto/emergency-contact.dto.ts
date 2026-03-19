import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmergencyContactDto {
  @ApiProperty({ description: 'Emergency contact full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Relationship to member' })
  @IsString()
  relationship: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ description: 'Alternative phone number' })
  @IsOptional()
  @IsString()
  alternativePhone?: string;
}
