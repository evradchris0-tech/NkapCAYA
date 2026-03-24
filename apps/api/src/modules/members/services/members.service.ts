import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@database/prisma.service';
import { MembersRepository, MemberProfileWithUser, MemberProfileSummary } from '../repositories/members.repository';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';
import { EmergencyContactDto } from '../dto/emergency-contact.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { FilterMembersDto } from '../dto/filter-members.dto';
import { PaginatedResult, paginate } from '@common/interfaces/paginated-result.interface';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function generateCode(length = 6): string {
  return Array.from(randomBytes(length))
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('');
}

export interface CreateMemberResult {
  profile: MemberProfileWithUser;
  temporaryPassword: string;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersRepository: MembersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMember(dto: CreateMemberDto): Promise<CreateMemberResult> {
    // ── Unicité phone1 (= User.phone, @unique en DB) ──────────────────────────
    const existingUser = await this.prisma.user.findUnique({ where: { phone: dto.phone1 } });
    if (existingUser) {
      throw new ConflictException(`Le numéro ${dto.phone1} est déjà associé à un compte`);
    }

    // ── Unicité phone2 : ne doit pas être déjà utilisé comme phone1 ou phone2 ─
    if (dto.phone2) {
      const phone2Conflict = await this.prisma.memberProfile.findFirst({
        where: { OR: [{ phone1: dto.phone2 }, { phone2: dto.phone2 }] },
      });
      const phone2AsUser = await this.prisma.user.findUnique({ where: { phone: dto.phone2 } });
      if (phone2Conflict || phone2AsUser) {
        throw new ConflictException(`Le numéro secondaire ${dto.phone2} est déjà utilisé`);
      }
    }

    // ── Génération memberCode unique ──────────────────────────────────────────
    const memberCode = await this.generateUniqueMemberCode();

    // ── Username par défaut = phone1 ─────────────────────────────────────────
    const username = dto.username ?? dto.phone1;
    const existingUsername = await this.prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new ConflictException(`Le username "${username}" est déjà utilisé`);
    }

    // ── Mot de passe temporaire unique par membre ─────────────────────────────
    const temporaryPassword = `Caya@${memberCode}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // ── Transaction atomique : User + MemberProfile ───────────────────────────
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

    // ── Envoi SMS credentials (non-bloquant : n'annule pas la création) ───────
    await this.notificationsService.sendCredentialsSms(dto.phone1, {
      firstName: dto.firstName,
      memberCode,
      username,
      temporaryPassword,
    });

    return {
      profile: profile as MemberProfileWithUser,
      temporaryPassword,
    };
  }

  async findAll(filters: FilterMembersDto): Promise<PaginatedResult<MemberProfileSummary>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { data, total } = await this.membersRepository.findAll({ ...filters, page, limit });
    return paginate(data, total, page, limit);
  }

  async findById(id: string): Promise<MemberProfileWithUser> {
    const profile = await this.membersRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`Membre introuvable : ${id}`);
    }
    return profile;
  }

  async updateProfile(id: string, dto: UpdateMemberDto): Promise<MemberProfileWithUser> {
    const profile = await this.findById(id); // throws 404 si absent

    // Si phone1 change, vérifier unicité et synchroniser User.phone
    if (dto.phone1 && dto.phone1 !== profile.phone1) {
      const existingUser = await this.prisma.user.findUnique({ where: { phone: dto.phone1 } });
      if (existingUser && existingUser.id !== profile.user.id) {
        throw new ConflictException('Ce numéro de téléphone est déjà associé à un compte');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Mettre à jour MemberProfile
      await tx.memberProfile.update({
        where: { id },
        data: {
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
        },
      });

      // Synchroniser User.phone si phone1 a changé
      if (dto.phone1 && dto.phone1 !== profile.phone1) {
        await tx.user.update({
          where: { id: profile.user.id },
          data: { phone: dto.phone1 },
        });
      }
    });

    return this.membersRepository.findById(id) as Promise<MemberProfileWithUser>;
  }

  async deactivate(id: string): Promise<void> {
    const profile = await this.findById(id);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: profile.user.id },
        data: { isActive: false, deletedAt: new Date() },
      }),
      this.prisma.memberProfile.update({
        where: { id: profile.id },
        data: { deletedAt: new Date() },
      })
    ]);
  }

  async getMemberships(id: string) {
    await this.findById(id); // throws 404 si absent
    return this.membersRepository.findMembershipsByProfileId(id);
  }

  async findByUserId(userId: string): Promise<MemberProfileWithUser> {
    const profile = await this.prisma.memberProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, username: true, phone: true, role: true, isActive: true } },
        emergencyContacts: true,
      },
    });
    if (!profile) {
      throw new NotFoundException(`Profil membre introuvable pour cet utilisateur`);
    }
    return profile as MemberProfileWithUser;
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

  async reactivate(id: string): Promise<void> {
    // Cannot use findById() because it filters out deleted items!
    // We fetch without deletedAt filter
    const profile = await this.prisma.memberProfile.findUnique({
       where: { id },
       include: { user: true }
    });
    if (!profile) throw new NotFoundException('Membre introuvable');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: profile.user.id },
        data: { isActive: true, deletedAt: null },
      }),
      this.prisma.memberProfile.update({
        where: { id: profile.id },
        data: { deletedAt: null },
      })
    ]);
  }

  async resetPassword(id: string): Promise<void> {
    const profile = await this.findById(id);
    const temporaryPassword = `Caya@${profile.memberCode}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    
    await this.prisma.user.update({
      where: { id: profile.user.id },
      data: { passwordHash },
    });

    await this.notificationsService.sendCredentialsSms(profile.phone1, {
      firstName: profile.firstName,
      memberCode: profile.memberCode,
      username: profile.user.username,
      temporaryPassword,
    });
  }

  async changeRole(id: string, role: string): Promise<void> {
    const profile = await this.findById(id);
    await this.prisma.user.update({
      where: { id: profile.user.id },
      data: { role: role as import('@prisma/client').BureauRole },
    });
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
