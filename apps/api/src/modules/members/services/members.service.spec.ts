import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { MembersRepository } from '../repositories/members.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('MembersService', () => {
  let service: MembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: MembersRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMembershipsByMemberId: jest.fn(),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMember()', () => {
    it('should create a new member', async () => {
      await expect(service.createMember({ firstName: 'Jean', lastName: 'Dupont', email: 'j@test.com' })).rejects.toThrow('Not implemented');
    });
  });

  describe('findAll()', () => {
    it('should return all members', async () => {
      await expect(service.findAll()).rejects.toThrow('Not implemented');
    });
  });

  describe('findById()', () => {
    it('should return a member by id', async () => {
      await expect(service.findById('member-id')).rejects.toThrow('Not implemented');
    });
  });

  describe('updateProfile()', () => {
    it('should update a member profile', async () => {
      await expect(service.updateProfile('member-id', {})).rejects.toThrow('Not implemented');
    });
  });

  describe('getMemberships()', () => {
    it('should return memberships for a member', async () => {
      await expect(service.getMemberships('member-id')).rejects.toThrow('Not implemented');
    });
  });
});
