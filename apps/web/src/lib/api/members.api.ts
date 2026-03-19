import apiClient from './client';
import type { Member, PaginatedResponse } from '@/types/api.types';

export interface CreateMemberPayload {
  firstName: string;
  lastName: string;
  phone1: string;
  phone2?: string;
  neighborhood: string;
  locationDetail?: string;
  mobileMoneyType?: string;
  mobileMoneyNumber?: string;
  sponsorId?: string;
  username?: string;
}

export const membersApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get<PaginatedResponse<Member>>('/members', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Member>(`/members/${id}`).then((r) => r.data),

  create: (payload: CreateMemberPayload) =>
    apiClient.post<Member>('/members', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateMemberPayload>) =>
    apiClient.patch<Member>(`/members/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/members/${id}`).then((r) => r.data),
};
