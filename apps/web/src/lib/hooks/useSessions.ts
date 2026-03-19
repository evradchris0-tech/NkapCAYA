import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  sessionsApi,
  CreateSessionPayload,
  CreateTransactionPayload,
} from '@lib/api/sessions.api';

const SESSIONS_KEY = ['sessions'] as const;

export function useSessions(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, params],
    queryFn: () => sessionsApi.getAll(params),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, id],
    queryFn: () => sessionsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useSessionTransactions(sessionId: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, sessionId, 'transactions'],
    queryFn: () => sessionsApi.getTransactions(sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => sessionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
    },
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      payload,
    }: {
      sessionId: string;
      payload: CreateTransactionPayload;
    }) => sessionsApi.addTransaction(sessionId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...SESSIONS_KEY, variables.sessionId],
      });
    },
  });
}
