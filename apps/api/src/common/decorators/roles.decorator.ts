import { SetMetadata } from '@nestjs/common';
import { BureauRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: BureauRole[]) => SetMetadata(ROLES_KEY, roles);
