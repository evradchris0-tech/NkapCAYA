import { IsString, IsEnum, IsNumber, IsDateString, Min, Max, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentType } from '@prisma/client';

export class AddMemberDto {
  @ApiProperty({ description: 'ID du MemberProfile', example: 'uuid-...' })
  @IsString()
  profileId: string;

  @ApiProperty({ description: 'Type d\'inscription', enum: EnrollmentType, example: EnrollmentType.NEW })
  @IsEnum(EnrollmentType)
  enrollmentType: EnrollmentType;

  @ApiProperty({ description: 'Nombre de parts (0.25, 0.5, 1.0...)', example: 1 })
  @IsNumber()
  @Min(0.25)
  @Max(10)
  sharesCount: number;

  @ApiProperty({ description: 'Date d\'inscription (ISO 8601)', example: '2025-10-01' })
  @IsDateString()
  joinedAt: string;

  @ApiProperty({ description: 'Mois d\'inscription dans l\'exercice (1-12)', example: 1 })
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(12)
  joinedAtMonth: number;
}
