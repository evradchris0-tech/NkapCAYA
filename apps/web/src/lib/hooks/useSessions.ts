import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi, RecordEntryPayload } from '@lib/api/sessions.api';

const SESSIONS_KEY = ['sessions'] as const;

export function useSessionsByFiscalYear(fiscalYearId: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, 'fy', fiscalYearId],
    queryFn: () => sessionsApi.getByFiscalYear(fiscalYearId),
    enabled: Boolean(fiscalYearId),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, id],
    queryFn: () => sessionsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.open(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
    },
  });
}

export function useRecordEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordEntryPayload) => sessionsApi.recordEntry(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, sessionId] });
    },
  });
}

export function useCloseForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.closeForReview(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
    },
  });
}

export function useValidateAndClose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.validateAndClose(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
    },
  });
}
