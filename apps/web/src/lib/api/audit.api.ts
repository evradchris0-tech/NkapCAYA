import apiClient from './client';
import type { PaginatedResponse } from '@/types/api.types';

export interface AuditLogDto {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData: any;
  afterData: any;
  reason: string;
  ipAddress: string;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    role: string;
  };
}

export const auditApi = {
  findAll: (params: { page?: number; limit?: number; entityType?: string; actorId?: string }) =>
    apiClient.get<PaginatedResponse<AuditLogDto>>('/audit-log', { params }).then((r) => r.data),
};
