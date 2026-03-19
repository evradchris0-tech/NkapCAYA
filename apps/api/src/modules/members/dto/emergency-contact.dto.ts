import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmergencyContactDto {
  @ApiProperty({ example: 'Marie MBARGA', description: 'Nom complet du contact' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '237699001122', description: 'Numéro de téléphone' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,20}$/, { message: 'phone doit être un numéro valide' })
  phone: string;

  @ApiPropertyOptional({ example: 'Épouse', description: 'Lien de parenté' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relation?: string;
}
