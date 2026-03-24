import apiClient from './client';
import type { FiscalYear, FiscalYearMembership } from '@/types/api.types';

export interface CreateFiscalYearPayload {
  label: string;
  startDate: string;
  endDate: string;
  cassationDate: string;
  loanDueDate: string;
  notes?: string;
}

export interface AddMemberPayload {
  profileId: string;
  enrollmentType: 'NEW' | 'RETURNING' | 'MID_YEAR';
  sharesCount: number;
  joinedAt: string;
  joinedAtMonth: number;
}

export const fiscalYearApi = {
  getAll: () =>
    apiClient.get<FiscalYear[]>('/fiscal-years').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<FiscalYear>(`/fiscal-years/${id}`).then((r) => r.data),

  create: (payload: CreateFiscalYearPayload) =>
    apiClient.post<FiscalYear>('/fiscal-years', payload).then((r) => r.data),

  activate: (id: string) =>
    apiClient.patch<FiscalYear>(`/fiscal-years/${id}/activate`).then((r) => r.data),

  openCassation: (id: string) =>
    apiClient.patch<FiscalYear>(`/fiscal-years/${id}/open-cassation`).then((r) => r.data),

  getMemberships: (id: string) =>
    apiClient.get<FiscalYearMembership[]>(`/fiscal-years/${id}/memberships`).then((r) => r.data),

  addMember: (id: string, payload: AddMemberPayload) =>
    apiClient.post<FiscalYearMembership>(`/fiscal-years/${id}/members`, payload).then((r) => r.data),
};
