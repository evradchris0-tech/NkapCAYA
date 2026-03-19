import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersRepository } from '../repositories/members.repository';
import { PrismaService } from '@database/prisma.service';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockProfile = {
  id: 'profile-uuid-1',
  memberCode: 'MBA3X7K2',
  userId: 'u_test0001',
  firstName: 'Jean-Pierre',
  lastName: 'MBARGA',
  phone1: '237699001122',
  phone2: null,
  neighborhood: 'Bastos',
  locationDetail: null,
  mobileMoneyType: 'MTN',
  mobileMoneyNumber: '237699001122',
  sponsorId: null,
  attachmentPhoto: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'u_test0001', username: '237699001122', phone: '237699001122', role: 'MEMBRE', isActive: true },
  emergencyContacts: [],
};

const mockCreateDto = {
  firstName: 'Jean-Pierre',
  lastName: 'MBARGA',
  phone1: '237699001122',
  neighborhood: 'Bastos',
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('MembersService', () => {
  let service: MembersService;
  let repo: jest.Mocked<MembersRepository>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: MembersRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            memberCodeExists: jest.fn().mockResolvedValue(false),
            update: jest.fn(),
            findMembershipsByProfileId: jest.fn(),
            addEmergencyContact: jest.fn(),
            findEmergencyContacts: jest.fn(),
            deleteEmergencyContact: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    repo = module.get(MembersRepository);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── T01 — Création membre ─────────────────────────────────────────────────

  describe('T01 — createMember crée User + MemberProfile atomiquement', () => {
    it('should return profile and temporaryPassword', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) =>
        fn({
          user: { create: jest.fn().mockResolvedValue({ id: 'u_test0001' }) },
          memberProfile: { create: jest.fn().mockResolvedValue(mockProfile) },
        }),
      );

      const result = await service.createMember(mockCreateDto as any);

      expect(result.profile).toBeDefined();
      expect(result.profile.firstName).toBe('Jean-Pierre');
      expect(result.temporaryPassword).toMatch(/^Caya@MB/);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ── T02 — Doublon phone1 ──────────────────────────────────────────────────

  describe('T02 — createMember avec phone1 déjà utilisé', () => {
    it('should throw ConflictException', async () => {
      // Premier findUnique = vérification phone → existe déjà
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'existing', phone: '237699001122' });

      await expect(service.createMember(mockCreateDto as any)).rejects.toThrow(ConflictException);
    });
  });

  // ── T03 — findAll ─────────────────────────────────────────────────────────

  describe('T03 — findAll retourne la liste', () => {
    it('should return array of profiles', async () => {
      repo.findAll.mockResolvedValue([mockProfile as any]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].memberCode).toBe('MBA3X7K2');
    });
  });

  // ── T04 — findById existant ───────────────────────────────────────────────

  describe('T04 — findById existant', () => {
    it('should return full profile', async () => {
      repo.findById.mockResolvedValue(mockProfile as any);

      const result = await service.findById('profile-uuid-1');

      expect(result.id).toBe('profile-uuid-1');
      expect(result.emergencyContacts).toEqual([]);
    });
  });

  // ── T05 — findById inconnu ────────────────────────────────────────────────

  describe('T05 — findById inconnu → NotFoundException', () => {
    it('should throw NotFoundException', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ── T06 — updateProfile ───────────────────────────────────────────────────

  describe('T06 — updateProfile modifie les champs via transaction', () => {
    it('should call prisma.$transaction and return updated profile', async () => {
      repo.findById.mockResolvedValue(mockProfile as any);
      const mockMemberProfileUpdate = jest.fn().mockResolvedValue(mockProfile);
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) =>
        fn({
          memberProfile: { update: mockMemberProfileUpdate },
          user: { update: jest.fn().mockResolvedValue({}) },
        }),
      );

      await service.updateProfile('profile-uuid-1', { neighborhood: 'Melen' } as any);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockMemberProfileUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'profile-uuid-1' },
          data: expect.objectContaining({ neighborhood: 'Melen' }),
        }),
      );
    });
  });

  // ── T06b — updateProfile synchronise User.phone si phone1 change ────────

  describe('T06b — updateProfile sync User.phone quand phone1 change', () => {
    it('should update User.phone in the same transaction', async () => {
      repo.findById.mockResolvedValue(mockProfile as any);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // pas de conflit
      const mockUserUpdate = jest.fn().mockResolvedValue({});
      (prisma.$transaction as jest.Mock).mockImplementation(async (fn: any) =>
        fn({
          memberProfile: { update: jest.fn().mockResolvedValue(mockProfile) },
          user: { update: mockUserUpdate },
        }),
      );

      await service.updateProfile('profile-uuid-1', { phone1: '237699999999' } as any);

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'u_test0001' },
        data: { phone: '237699999999' },
      });
    });
  });

  // ── T07 — deactivate ──────────────────────────────────────────────────────

  describe('T07 — deactivate désactive le compte User', () => {
    it('should set user.isActive = false', async () => {
      repo.findById.mockResolvedValue(mockProfile as any);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await service.deactivate('profile-uuid-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u_test0001' },
        data: { isActive: false },
      });
    });
  });

  // ── T08 — getMemberships ──────────────────────────────────────────────────

  describe('T08 — getMemberships retourne la liste des adhésions', () => {
    it('should return memberships for a profile', async () => {
      repo.findById.mockResolvedValue(mockProfile as any);
      repo.findMembershipsByProfileId.mockResolvedValue([]);

      const result = await service.getMemberships('profile-uuid-1');

      expect(result).toEqual([]);
      expect(repo.findMembershipsByProfileId).toHaveBeenCalledWith('profile-uuid-1');
    });
  });
});
