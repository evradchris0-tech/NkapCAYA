import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberDto {
  // ── Identité ──────────────────────────────────────────────────────────────

  @ApiProperty({ example: 'Jean-Pierre', description: 'Prénom' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'MBARGA', description: 'Nom de famille' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  // ── Téléphones ────────────────────────────────────────────────────────────

  @ApiProperty({ example: '237699001122', description: 'Téléphone principal (aussi utilisé pour le compte)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{8,19}$/, { message: 'phone1 doit être un numéro valide (8 à 19 chiffres, + optionnel)' })
  phone1: string;

  @ApiPropertyOptional({ example: '237677001122', description: 'Téléphone secondaire' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{8,19}$/, { message: 'phone2 doit être un numéro valide (8 à 19 chiffres, + optionnel)' })
  phone2?: string;

  // ── Localisation ─────────────────────────────────────────────────────────

  @ApiProperty({ example: 'Bastos', description: 'Quartier de résidence' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  neighborhood: string;

  @ApiPropertyOptional({ example: 'Face école publique, 3ème rue à gauche' })
  @IsOptional()
  @IsString()
  locationDetail?: string;

  // ── Mobile Money ──────────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'MTN', enum: ['MTN', 'ORANGE', 'EXPRESS_UNION'] })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobileMoneyType?: string;

  @ApiPropertyOptional({ example: '237699001122' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{8,19}$/, { message: 'mobileMoneyNumber doit être un numéro valide' })
  mobileMoneyNumber?: string;

  // ── Parrainage ────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'ID (UUID) du profil parrain' })
  @IsOptional()
  @IsUUID()
  sponsorId?: string;

  // ── Compte utilisateur ───────────────────────────────────────────────────

  @ApiPropertyOptional({
    example: 'jmbarga',
    description: 'Username pour le compte (défaut : phone1)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;
}
