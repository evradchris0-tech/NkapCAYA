import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Supprime les caractères de formatage d'un numéro de téléphone */
const normalizePhone = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/[\s\-()\\.]/g, '') : (value as string);

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

  @ApiProperty({ example: '+237 699 001 122', description: 'Téléphone principal (espaces/tirets acceptés)' })
  @Transform(({ value }) => normalizePhone(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{8,19}$/, { message: 'phone1 doit être un numéro valide (ex: +237699001122)' })
  phone1: string;

  @ApiPropertyOptional({ example: '+237 677 001 122', description: 'Téléphone secondaire' })
  @IsOptional()
  @Transform(({ value }) => (value ? normalizePhone(value) : value))
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{8,19}$/, { message: 'phone2 doit être un numéro valide' })
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

  @ApiPropertyOptional({ example: '+237 699 001 122' })
  @IsOptional()
  @Transform(({ value }) => (value ? normalizePhone(value) : value))
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
