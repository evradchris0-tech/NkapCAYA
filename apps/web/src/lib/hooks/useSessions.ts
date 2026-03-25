import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sessionsApi, RecordEntryPayload } from '@lib/api/sessions.api';

const SESSIONS_KEY = ['sessions'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

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
      toast.success('Session ouverte.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useRecordEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordEntryPayload) => sessionsApi.recordEntry(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, sessionId] });
      toast.success('Entrée enregistrée.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useCloseForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.closeForReview(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
      toast.success('Session soumise pour révision.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useValidateAndClose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.validateAndClose(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
      toast.success('Session validée et clôturée.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
