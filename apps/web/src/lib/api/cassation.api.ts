import apiClient from './client';
import type { CassationRecord } from '@/types/api.types';

export const cassationApi = {
  getByFiscalYear: (fiscalYearId: string) =>
    apiClient
      .get<CassationRecord>(`/fiscal-years/${fiscalYearId}/cassation`)
      .then((r) => r.data),

  execute: (fiscalYearId: string) =>
    apiClient
      .post<CassationRecord>(`/fiscal-years/${fiscalYearId}/cassation/execute`, {})
      .then((r) => r.data),

  getActiveLoans: (fiscalYearId: string) =>
    apiClient
      .get<any[]>(`/fiscal-years/${fiscalYearId}/cassation/active-loans`)
      .then((r) => r.data),
};
