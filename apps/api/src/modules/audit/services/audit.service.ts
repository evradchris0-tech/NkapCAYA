import { Injectable } from '@nestjs/common';
import { AuditRepository } from '../repositories/audit.repository';
import { AuditLogQueryDto } from '../dtos/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async findAll(query: AuditLogQueryDto) {
    return this.repository.findAll(query);
  }
}
