import apiClient from './client';
import type { Session, Transaction, PaginatedResponse } from '@/types/api.types';

export interface CreateSessionPayload {
  month: number;
  year: number;
  date: string;
}

export interface CreateTransactionPayload {
  memberId: string;
  type: 'EPARGNE' | 'TONTINE' | 'INTERET' | 'SECOURS' | 'PRET_REMBOURSEMENT';
  amount: number;
  note?: string;
}

export const sessionsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient
      .get<PaginatedResponse<Session>>('/sessions', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Session>(`/sessions/${id}`).then((r) => r.data),

  create: (payload: CreateSessionPayload) =>
    apiClient.post<Session>('/sessions', payload).then((r) => r.data),

  addTransaction: (sessionId: string, payload: CreateTransactionPayload) =>
    apiClient
      .post<Transaction>(`/sessions/${sessionId}/transactions`, payload)
      .then((r) => r.data),

  getTransactions: (sessionId: string) =>
    apiClient
      .get<Transaction[]>(`/sessions/${sessionId}/transactions`)
      .then((r) => r.data),
};
