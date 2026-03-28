import { IsDateString, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateMembershipDto {
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(12)
  joinedAtMonth?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(10)
  sharesCount?: number;
}
