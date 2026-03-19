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

  async findAll(): Promise<MemberProfileSummary[]> {
    return this.prisma.memberProfile.findMany({
      include: {
        user: { select: { id: true, username: true, phone: true, role: true, isActive: true } },
      },
      orderBy: { lastName: 'asc' },
    }) as Promise<MemberProfileSummary[]>;
  }

  async findById(id: string): Promise<MemberProfileWithUser | null> {
    return this.prisma.memberProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, phone: true, role: true, isActive: true } },
        emergencyContacts: true,
      },
    }) as Promise<MemberProfileWithUser | null>;
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
    await this.prisma.emergencyContact.delete({ where: { id } });
  }
}
