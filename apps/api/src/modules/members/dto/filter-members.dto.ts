import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BureauRole } from '@prisma/client';
// Use truthy string conversion or class-transformer for booleans
import { Transform } from 'class-transformer';
import { PaginationDto } from '@common/dto/pagination.dto';

export class FilterMembersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Recherche par nom, prénom, code ou téléphone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BureauRole, description: 'Filtrer par rôle' })
  @IsOptional()
  @IsEnum(BureauRole)
  role?: BureauRole;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif/inactif (true/false)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
