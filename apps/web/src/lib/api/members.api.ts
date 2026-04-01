import apiClient from './client';
import type {
  Member,
  EmergencyContact,
  CreateMemberResult,
  PaginatedResponse,
} from '@/types/api.types';

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

export interface AddEmergencyContactPayload {
  fullName: string;
  phone: string;
  relation?: string;
}

export const membersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) =>
    apiClient
      .get<PaginatedResponse<Member>>('/members', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Member>(`/members/${id}`).then((r) => r.data),

  create: (payload: CreateMemberPayload) =>
    apiClient.post<CreateMemberResult>('/members', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateMemberPayload>) =>
    apiClient.patch<Member>(`/members/${id}`, payload).then((r) => r.data),

  deactivate: (id: string) =>
    apiClient.delete(`/members/${id}`).then((r) => r.data),

  reactivate: (id: string) =>
    apiClient.patch(`/members/${id}/reactivate`).then((r) => r.data),

  getEmergencyContacts: (id: string) =>
    apiClient
      .get<EmergencyContact[]>(`/members/${id}/emergency-contacts`)
      .then((r) => r.data),

  addEmergencyContact: (id: string, payload: AddEmergencyContactPayload) =>
    apiClient
      .post<EmergencyContact>(`/members/${id}/emergency-contacts`, payload)
      .then((r) => r.data),

  removeEmergencyContact: (id: string, contactId: string) =>
    apiClient
      .delete(`/members/${id}/emergency-contacts/${contactId}`)
      .then((r) => r.data),

  getMemberships: (id: string) =>
    apiClient.get(`/members/${id}/memberships`).then((r) => r.data),

  changeRole: (id: string, role: string) =>
    apiClient.patch(`/members/${id}/role`, { role }).then((r) => r.data),

  getMe: () =>
    apiClient.get<Member>('/members/me').then((r) => r.data),
};
