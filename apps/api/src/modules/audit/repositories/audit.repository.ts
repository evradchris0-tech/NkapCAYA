import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AuditLogQueryDto } from '../dtos/audit.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditLogQueryDto) {
    const { entityType, actorId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};
    if (entityType) where.entityType = entityType;
    if (actorId) where.actorId = actorId;
    where.deletedAt = null;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, username: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
