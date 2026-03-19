import apiClient from './client';
import type { SavingsSummary, InterestEntry } from '@types/api.types';

export const savingsApi = {
  getSummary: () =>
    apiClient.get<SavingsSummary>('/savings/summary').then((r) => r.data),

  getMemberSavings: (memberId: string) =>
    apiClient.get<SavingsSummary>(`/savings/members/${memberId}`).then((r) => r.data),

  getInterestHistory: (params?: { memberId?: string; year?: number }) =>
    apiClient
      .get<InterestEntry[]>('/savings/interests', { params })
      .then((r) => r.data),
};
