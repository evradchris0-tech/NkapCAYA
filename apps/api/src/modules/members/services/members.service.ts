import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@database/prisma.service';
import { MembersRepository, MemberProfileWithUser, MemberProfileSummary } from '../repositories/members.repository';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { EmergencyContactDto } from '../dto/emergency-contact.dto';

const generateCode = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

interface CreateMemberResult {
  profile: MemberProfileWithUser;
  temporaryPassword: string;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersRepository: MembersRepository,
  ) {}

  async createMember(dto: CreateMemberDto): Promise<CreateMemberResult> {
    // Vérifier l'unicité du phone1 (= User.phone)
    const existingUser = await this.prisma.user.findUnique({ where: { phone: dto.phone1 } });
    if (existingUser) {
      throw new ConflictException('Ce numéro de téléphone est déjà associé à un compte');
    }

    // Générer memberCode unique
    const memberCode = await this.generateUniqueMemberCode();

    // Username par défaut = phone1
    const username = dto.username ?? dto.phone1;

    // Vérifier unicité du username
    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException('Ce username est déjà utilisé');
    }

    // Mot de passe temporaire
    const temporaryPassword = `Caya@${memberCode}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Transaction atomique : User + MemberProfile
    const profile = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          phone: dto.phone1,
          passwordHash,
          role: 'MEMBRE',
          isActive: true,
        },
      });

      const created = await tx.memberProfile.create({
        data: {
          memberCode,
          userId: user.id,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone1: dto.phone1,
          phone2: dto.phone2,
          neighborhood: dto.neighborhood,
          locationDetail: dto.locationDetail,
          mobileMoneyType: dto.mobileMoneyType,
          mobileMoneyNumber: dto.mobileMoneyNumber,
          sponsorId: dto.sponsorId,
        },
        include: {
          user: { select: { id: true, username: true, phone: true, role: true, isActive: true } },
          emergencyContacts: true,
        },
      });

      return created;
    });

    return {
      profile: profile as MemberProfileWithUser,
      temporaryPassword,
    };
  }

  async findAll(): Promise<MemberProfileSummary[]> {
    return this.membersRepository.findAll();
  }

  async findById(id: string): Promise<MemberProfileWithUser> {
    const profile = await this.membersRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Membre introuvable : ${id}`);
    }
    return profile;
  }

  async updateProfile(id: string, dto: UpdateMemberDto): Promise<MemberProfileWithUser> {
    await this.findById(id); // throws 404 si absent

    await this.membersRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone1: dto.phone1,
      phone2: dto.phone2,
      neighborhood: dto.neighborhood,
      locationDetail: dto.locationDetail,
      mobileMoneyType: dto.mobileMoneyType,
      mobileMoneyNumber: dto.mobileMoneyNumber,
      ...(dto.sponsorId !== undefined && {
        sponsor: dto.sponsorId
          ? { connect: { id: dto.sponsorId } }
          : { disconnect: true },
      }),
    });

    return this.membersRepository.findById(id) as Promise<MemberProfileWithUser>;
  }

  async deactivate(id: string): Promise<void> {
    const profile = await this.findById(id);
    await this.prisma.user.update({
      where: { id: profile.user.id },
      data: { isActive: false },
    });
  }

  async getMemberships(id: string) {
    await this.findById(id); // throws 404 si absent
    return this.membersRepository.findMembershipsByProfileId(id);
  }

  async addEmergencyContact(id: string, dto: EmergencyContactDto) {
    await this.findById(id); // throws 404 si absent
    return this.membersRepository.addEmergencyContact(id, {
      fullName: dto.fullName,
      phone: dto.phone,
      relation: dto.relation,
    });
  }

  async getEmergencyContacts(id: string) {
    await this.findById(id);
    return this.membersRepository.findEmergencyContacts(id);
  }

  async removeEmergencyContact(contactId: string): Promise<void> {
    await this.membersRepository.deleteEmergencyContact(contactId);
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

  private async generateUniqueMemberCode(): Promise<string> {
    let code: string;
    let attempts = 0;
    do {
      code = `MB${generateCode()}`;
      attempts++;
      if (attempts > 10) throw new Error('Impossible de générer un memberCode unique');
    } while (await this.membersRepository.memberCodeExists(code));
    return code;
  }
}
