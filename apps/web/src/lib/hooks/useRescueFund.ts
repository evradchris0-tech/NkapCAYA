import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rescueFundApi, RecordRescueEventPayload } from '@lib/api/rescue-fund.api';

const RF_KEY = ['rescue-fund'] as const;

export function useRescueFundLedger(fiscalYearId: string) {
  return useQuery({
    queryKey: [...RF_KEY, fiscalYearId],
    queryFn: () => rescueFundApi.getLedger(fiscalYearId),
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
    },
  });
}
