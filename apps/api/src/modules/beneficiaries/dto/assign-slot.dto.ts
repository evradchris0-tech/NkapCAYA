import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSlotDto {
  @ApiProperty({ description: 'Membership ID à désigner comme bénéficiaire' })
  @IsUUID()
  membershipId: string;
}
