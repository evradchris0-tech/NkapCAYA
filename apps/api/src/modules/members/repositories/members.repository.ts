import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    throw new Error('Not implemented');
  }

  async findAll() {
    throw new Error('Not implemented');
  }

  async findById(id: string) {
    throw new Error('Not implemented');
  }

  async update(id: string, data: any) {
    throw new Error('Not implemented');
  }

  async delete(id: string) {
    throw new Error('Not implemented');
  }

  async findMembershipsByMemberId(memberId: string) {
    throw new Error('Not implemented');
  }

  async findEmergencyContacts(memberId: string) {
    throw new Error('Not implemented');
  }

  async upsertEmergencyContact(memberId: string, data: any) {
    throw new Error('Not implemented');
  }
}
