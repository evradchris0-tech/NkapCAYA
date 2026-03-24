import apiClient from './client';
import type { LoanAccount, LoanRepayment } from '@/types/api.types';

export interface RequestLoanPayload {
  membershipId: string;
  amount: number;
  dueBeforeDate: string;
  requestNotes?: string;
}

export interface ApplyRepaymentPayload {
  amount: number;
  sessionId?: string;
}

export const loansApi = {
  getByMembership: (membershipId: string) =>
    apiClient.get<LoanAccount[]>('/loans', { params: { membershipId } }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<LoanAccount>(`/loans/${id}`).then((r) => r.data),

  request: (payload: RequestLoanPayload) =>
    apiClient.post<LoanAccount>('/loans/request', payload).then((r) => r.data),

  approve: (id: string) =>
    apiClient.patch<LoanAccount>(`/loans/${id}/approve`).then((r) => r.data),

  repay: (id: string, payload: ApplyRepaymentPayload) =>
    apiClient.post<LoanRepayment>(`/loans/${id}/repay`, payload).then((r) => r.data),
};
