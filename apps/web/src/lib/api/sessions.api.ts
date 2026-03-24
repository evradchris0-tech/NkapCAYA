import apiClient from './client';
import type { MonthlySession, SessionEntry } from '@/types/api.types';
import type { TransactionType } from '@/types/domain.types';

export interface RecordEntryPayload {
  membershipId: string;
  type: TransactionType;
  amount: number;
  loanId?: string;
  isOutOfSession?: boolean;
  outOfSessionRef?: string;
  notes?: string;
}

export const sessionsApi = {
  getByFiscalYear: (fiscalYearId: string) =>
    apiClient
      .get<MonthlySession[]>(`/fiscal-years/${fiscalYearId}/sessions`)
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<MonthlySession>(`/sessions/${id}`).then((r) => r.data),

  open: (id: string) =>
    apiClient.post<MonthlySession>(`/sessions/${id}/open`).then((r) => r.data),

  recordEntry: (id: string, payload: RecordEntryPayload) =>
    apiClient.post<SessionEntry>(`/sessions/${id}/entries`, payload).then((r) => r.data),

  closeForReview: (id: string) =>
    apiClient.post<MonthlySession>(`/sessions/${id}/close-review`).then((r) => r.data),

  validateAndClose: (id: string) =>
    apiClient.post<MonthlySession>(`/sessions/${id}/validate`).then((r) => r.data),
};
