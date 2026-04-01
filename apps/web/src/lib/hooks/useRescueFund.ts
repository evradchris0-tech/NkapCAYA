import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { rescueFundApi, RecordRescueEventPayload } from '@lib/api/rescue-fund.api';

const RF_KEY = ['rescue-fund'] as const;

const apiError = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const msg = err?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

export function useRescueFundLedger(fiscalYearId: string) {
  return useQuery({
    queryKey: [...RF_KEY, fiscalYearId],
    queryFn: () =>
      rescueFundApi.getLedger(fiscalYearId).catch((err) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),
    enabled: Boolean(fiscalYearId),
  });
}

export function useRescueFundEvents(fiscalYearId: string) {
  return useQuery({
    queryKey: [...RF_KEY, fiscalYearId, 'events'],
    queryFn: () => rescueFundApi.getEvents(fiscalYearId),
    enabled: Boolean(fiscalYearId),
  });
}

export function useRecordRescueEvent(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordRescueEventPayload) =>
      rescueFundApi.recordEvent(fiscalYearId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...RF_KEY, fiscalYearId] });
      queryClient.invalidateQueries({ queryKey: [...RF_KEY, fiscalYearId, 'events'] });
      toast.success('Événement de secours enregistré.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
