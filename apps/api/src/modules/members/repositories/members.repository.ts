import { Injectable } from '@nestjs/common';
import { MemberProfile, EmergencyContact, Membership, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';

export type MemberProfileWithUser = MemberProfile & {
  user: { id: string; username: string; phone: string; role: string; isActive: boolean };
  emergencyContacts: EmergencyContact[];
};

export type MemberProfileSummary = MemberProfile & {
  user: { id: string; username: string; phone: string; role: string; isActive: boolean };
};

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.MemberProfileCreateInput): Promise<MemberProfile> {
    return this.prisma.memberProfile.create({ data });
  }

  async findAll(filters: { page: number; limit: number; search?: string; role?: string; isActive?: boolean }): Promise<{ data: MemberProfileSummary[]; total: number }> {
    const { page, limit, search, role, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberProfileWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { memberCode: { contains: search } },
        { phone1: { contains: search } },
        { phone2: { contains: search } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userFilters: any = {};
    if (role) userFilters.role = role;
    if (isActive !== undefined) userFilters.isActive = isActive;

    if (Object.keys(userFilters).length > 0) where.user = userFilters;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.memberProfile.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, phone: true, role: true, isActive: true } },
        },
        orderBy: { lastName: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.memberProfile.count({ where }),
    ]);

    return { data: data as MemberProfileSummary[], total };
  }

  async findById(id: string): Promise<MemberProfileWithUser | null> {
    const profile = await this.prisma.memberProfile.findFirst({
      where: { id },
      include: {
        user: { select: { id: true, username: true, phone: true, role: true, isActive: true } },
        emergencyContacts: { where: { deletedAt: null } },
      },
    });
    return profile as MemberProfileWithUser | null;
  }

  async findByUserId(userId: string): Promise<MemberProfile | null> {
    return this.prisma.memberProfile.findUnique({ where: { userId } });
  }

  async memberCodeExists(code: string): Promise<boolean> {
    const count = await this.prisma.memberProfile.count({ where: { memberCode: code } });
    return count > 0;
  }

  async update(id: string, data: Prisma.MemberProfileUpdateInput): Promise<MemberProfile> {
    return this.prisma.memberProfile.update({ where: { id }, data });
  }

  async findMembershipsByProfileId(profileId: string): Promise<Membership[]> {
    return this.prisma.membership.findMany({
      where: { profileId },
      include: {
        fiscalYear: { select: { id: true, label: true, status: true, startDate: true, endDate: true } },
        shareCommitment: { select: { sharesCount: true, monthlyAmount: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async addEmergencyContact(
    profileId: string,
    data: { fullName: string; phone: string; relation?: string },
  ): Promise<EmergencyContact> {
    return this.prisma.emergencyContact.create({
      data: { profileId, ...data },
    });
  }

  async findEmergencyContacts(profileId: string): Promise<EmergencyContact[]> {
    return this.prisma.emergencyContact.findMany({ where: { profileId } });
  }

  async deleteEmergencyContact(id: string): Promise<void> {
    await this.prisma.emergencyContact.update({ 
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
