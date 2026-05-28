import apiClient from './client';
import type { SavingsLedger } from '@/types/api.types';

export const savingsApi = {
  getByMembership: (membershipId: string) =>
    apiClient
      .get<SavingsLedger>(`/savings/${membershipId}`)
      .then((r) => r.data),

  getFiscalYearBalances(fiscalYearId: string) {
    return apiClient
      .get<SavingsLedger[]>(`/savings/fiscal-years/${fiscalYearId}`)
      .then((res) => res.data);
  },
};
