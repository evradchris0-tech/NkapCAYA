import apiClient from './client';
import type { SavingsLedger } from '@/types/api.types';

export const savingsApi = {
  getByMembership: (membershipId: string) =>
    apiClient
      .get<SavingsLedger>(`/savings/${membershipId}`)
      .then((r) => r.data),

  getFiscalYearBalances: (fiscalYearId: string) =>
    apiClient
      .get<SavingsLedger[]>(`/fiscal-years/${fiscalYearId}/savings`)
      .then((r) => r.data),
};
