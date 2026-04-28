import apiClient from './client';
import type { FiscalYearExportData } from '@/types/api.types';
import type { ImportFiscalYearDto } from '@lib/import/parseCAYABASE';

export const reportsApi = {
  getFullFiscalYearData: (fiscalYearId: string) =>
    apiClient
      .get<FiscalYearExportData>('/reports/annual-summary', {
        params: { fiscalYearId },
      })
      .then((r) => r.data),

  importFiscalYear: (data: ImportFiscalYearDto) =>
    apiClient
      .post<{ fiscalYearId: string; membersCreated: number; membersMatched: number; sessionsCreated: number }>(
        '/reports/import-fiscal-year',
        data,
      )
      .then((r) => r.data),
};
