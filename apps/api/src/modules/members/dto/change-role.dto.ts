import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BureauRole } from '@prisma/client';

export class ChangeRoleDto {
  @ApiProperty({ enum: BureauRole })
  @IsEnum(BureauRole)
  role: BureauRole;
}
