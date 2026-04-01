import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mot de passe actuel' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Nouveau mot de passe', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
