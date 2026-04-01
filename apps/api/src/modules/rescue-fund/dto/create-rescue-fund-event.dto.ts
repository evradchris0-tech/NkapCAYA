import { IsUUID, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RescueEventType } from '@prisma/client';

export class CreateRescueFundEventDto {
  @ApiProperty({ description: 'Membership ID du bénéficiaire' })
  @IsUUID()
  beneficiaryMembershipId: string;

  @ApiProperty({ enum: RescueEventType, description: 'Type d\'événement (montant fixé en DB)' })
  @IsEnum(RescueEventType)
  eventType: RescueEventType;

  @ApiProperty({ description: 'Date de l\'événement (ISO date)' })
  @IsDateString()
  eventDate: string;

  @ApiPropertyOptional({ description: 'Description / commentaire' })
  @IsOptional()
  @IsString()
  description?: string;
}
