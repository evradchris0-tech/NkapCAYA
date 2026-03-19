import apiClient from './client';
import type { Loan, LoanRepayment, PaginatedResponse } from '@types/api.types';

export interface CreateLoanPayload {
  memberId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  purpose?: string;
}

export const loansApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient
      .get<PaginatedResponse<Loan>>('/loans', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Loan>(`/loans/${id}`).then((r) => r.data),

  create: (payload: CreateLoanPayload) =>
    apiClient.post<Loan>('/loans', payload).then((r) => r.data),

  addRepayment: (loanId: string, amount: number) =>
    apiClient
      .post<LoanRepayment>(`/loans/${loanId}/repayments`, { amount })
      .then((r) => r.data),

  getRepayments: (loanId: string) =>
    apiClient
      .get<LoanRepayment[]>(`/loans/${loanId}/repayments`)
      .then((r) => r.data),
};
