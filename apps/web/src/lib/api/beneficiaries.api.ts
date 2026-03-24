import apiClient from './client';
import type { BeneficiarySchedule, BeneficiarySlot } from '@/types/api.types';

export const beneficiariesApi = {
  getSchedule: (fiscalYearId: string) =>
    apiClient
      .get<BeneficiarySchedule>(`/fiscal-years/${fiscalYearId}/beneficiaries/schedule`)
      .then((r) => r.data),

  assignSlot: (fiscalYearId: string, slotId: string, membershipId: string) =>
    apiClient
      .post<BeneficiarySlot>(`/fiscal-years/${fiscalYearId}/beneficiaries/slots/${slotId}/assign`, { membershipId })
      .then((r) => r.data),

  markDelivered: (fiscalYearId: string, slotId: string) =>
    apiClient
      .patch<BeneficiarySlot>(`/fiscal-years/${fiscalYearId}/beneficiaries/slots/${slotId}/deliver`, {})
      .then((r) => r.data),
};
