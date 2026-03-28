import { IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignSlotDto {
  @ApiProperty({ description: 'Membership ID à désigner comme bénéficiaire' })
  @IsUUID()
  membershipId: string;

  @ApiPropertyOptional({ description: 'Ce bénéficiaire est-il l\'hôte de la réunion ?' })
  @IsOptional()
  @IsBoolean()
  isHost?: boolean;
}

