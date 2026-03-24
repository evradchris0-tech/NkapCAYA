import { IsString, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const normalizePhone = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/[\s\-\(\)\.]/g, '') : (value as string);

export class EmergencyContactDto {
  @ApiProperty({ example: 'Marie MBARGA', description: 'Nom complet du contact' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '+237 699 001 122', description: 'Numéro de téléphone (espaces/tirets acceptés)' })
  @Transform(({ value }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{8,19}$/, { message: 'phone doit être un numéro valide' })
  phone: string;

  @ApiPropertyOptional({ example: 'Épouse', description: 'Lien de parenté' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relation?: string;
}
