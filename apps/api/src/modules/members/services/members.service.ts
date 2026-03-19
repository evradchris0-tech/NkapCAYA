import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MembersRepository } from '../repositories/members.repository';
import { CreateMemberDto } from '../dto/create-member.dto';
import { UpdateMemberDto } from '../dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersRepository: MembersRepository,
  ) {}

  async createMember(dto: CreateMemberDto) {
    throw new Error('Not implemented');
  }

  async findAll() {
    throw new Error('Not implemented');
  }

  async findById(id: string) {
    throw new Error('Not implemented');
  }

  async updateProfile(id: string, dto: UpdateMemberDto) {
    throw new Error('Not implemented');
  }

  async remove(id: string) {
    throw new Error('Not implemented');
  }

  async getMemberships(memberId: string) {
    throw new Error('Not implemented');
  }
}
