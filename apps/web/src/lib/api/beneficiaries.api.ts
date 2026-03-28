import apiClient from './client';
import type { BeneficiarySchedule, BeneficiarySlot } from '@/types/api.types';

export const beneficiariesApi = {
  getSchedule: (fiscalYearId: string) =>
    apiClient
      .get<BeneficiarySchedule>(`/fiscal-years/${fiscalYearId}/beneficiaries/schedule`)
      .then((r) => r.data),

  assignSlot: (fiscalYearId: string, slotId: string, membershipId: string, isHost?: boolean) =>
    apiClient
      .post<BeneficiarySlot>(
        `/fiscal-years/${fiscalYearId}/beneficiaries/slots/${slotId}/assign`,
        { membershipId, isHost },
      )
      .then((r) => r.data),

  markDelivered: (fiscalYearId: string, slotId: string, amount?: number) =>
    apiClient
      .patch<BeneficiarySlot>(
        `/fiscal-years/${fiscalYearId}/beneficiaries/slots/${slotId}/deliver`,
        amount !== undefined ? { amount } : {},
      )
      .then((r) => r.data),

  setHost: (fiscalYearId: string, slotId: string) =>
    apiClient
      .patch<BeneficiarySlot>(
        `/fiscal-years/${fiscalYearId}/beneficiaries/slots/${slotId}/set-host`,
        {},
      )
      .then((r) => r.data),

  addSlotToSession: (fiscalYearId: string, sessionId: string) =>
    apiClient
      .post<BeneficiarySlot>(
        `/fiscal-years/${fiscalYearId}/beneficiaries/sessions/${sessionId}/slots`,
        {},
      )
      .then((r) => r.data),

  removeSlot: (fiscalYearId: string, slotId: string) =>
    apiClient
      .delete(`/fiscal-years/${fiscalYearId}/beneficiaries/slots/${slotId}`)
      .then((r) => r.data),
};
