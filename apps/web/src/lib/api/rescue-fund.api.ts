import apiClient from './client';
import type { RescueFundLedger, RescueFundEvent } from '@/types/api.types';
import type { RescueEventType } from '@/types/api.types';

export interface RecordRescueEventPayload {
  beneficiaryMembershipId: string;
  eventType: RescueEventType;
  eventDate: string;
  description?: string;
}

export const rescueFundApi = {
  getLedger: (fiscalYearId: string) =>
    apiClient
      .get<RescueFundLedger>(`/fiscal-years/${fiscalYearId}/rescue-fund`)
      .then((r) => r.data),

  getEvents: (fiscalYearId: string) =>
    apiClient
      .get<RescueFundEvent[]>(`/fiscal-years/${fiscalYearId}/rescue-fund/events`)
      .then((r) => r.data),

  recordEvent: (fiscalYearId: string, payload: RecordRescueEventPayload) =>
    apiClient
      .post<RescueFundEvent>(`/fiscal-years/${fiscalYearId}/rescue-fund/events`, payload)
      .then((r) => r.data),
};
