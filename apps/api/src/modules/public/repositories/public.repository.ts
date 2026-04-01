import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class PublicRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTontineConfig() {
    return this.prisma.tontineConfig.findUnique({
      where: { id: 'caya' },
      select: {
        id: true,
        name: true,
        acronym: true,
        foundedYear: true,
        motto: true,
        headquartersCity: true,
      },
    });
  }

  countActiveMembers() {
    return this.prisma.memberProfile.count({
      where: {
        deletedAt: null,
        user: { isActive: true, deletedAt: null },
      },
    });
  }
}
