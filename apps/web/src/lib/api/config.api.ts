import apiClient from './client';
import type { TontineConfig, RescueEventAmount } from '@/types/api.types';
import type { RescueEventType } from '@/types/api.types';

export interface UpdateConfigPayload {
  name?: string;
  acronym?: string;
  foundedYear?: number;
  motto?: string;
  headquartersCity?: string;
  registrationNumber?: string;
  shareUnitAmount?: number;
  halfShareAmount?: number;
  potMonthlyAmount?: number;
  maxSharesPerMember?: number;
  mandatoryInitialSavings?: number;
  loanMonthlyRate?: number;
  minLoanAmount?: number;
  maxLoanAmount?: number;
  maxLoanMultiplier?: number;
  minSavingsToLoan?: number;
  maxConcurrentLoans?: number;
  rescueFundTarget?: number;
  rescueFundMinBalance?: number;
  registrationFeeNew?: number;
  registrationFeeReturning?: number;
}

export const configApi = {
  getConfig: () =>
    apiClient.get<TontineConfig>('/config').then((r) => r.data),

  updateConfig: (payload: UpdateConfigPayload) =>
    apiClient.patch<TontineConfig>('/config', payload).then((r) => r.data),

  getRescueEventAmounts: () =>
    apiClient.get<RescueEventAmount[]>('/config/rescue-events').then((r) => r.data),

  updateRescueEventAmount: (eventType: RescueEventType, amount: number) =>
    apiClient
      .patch<RescueEventAmount>(`/config/rescue-events/${eventType}`, { amount })
      .then((r) => r.data),
};
