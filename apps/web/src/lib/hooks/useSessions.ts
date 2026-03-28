import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { sessionsApi, RecordEntryPayload } from '@lib/api/sessions.api';
import type { MonthlySession, SessionEntry } from '@/types/api.types';
import { SessionStatus } from '@/types/domain.types';

const SESSIONS_KEY = ['sessions'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? (msg[0] as string) : String(msg);
};

export function useSessionsByFiscalYear(fiscalYearId: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, 'fy', fiscalYearId],
    queryFn: () => sessionsApi.getByFiscalYear(fiscalYearId),
    enabled: Boolean(fiscalYearId),
    // Sessions : données les plus dynamiques — fraîches 1 min seulement
    staleTime: 60 * 1000,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, id],
    queryFn: () => sessionsApi.getById(id),
    enabled: Boolean(id),
    // Détail d'une session ouverte peut changer à tout moment
    staleTime: 30 * 1000,
  });
}

export function useOpenSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.open(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [...SESSIONS_KEY, id] });
      const previous = queryClient.getQueryData<MonthlySession>([...SESSIONS_KEY, id]);
      queryClient.setQueryData<MonthlySession>([...SESSIONS_KEY, id], (old) =>
        old ? { ...old, status: SessionStatus.OPEN } : old,
      );
      return { previous };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData([...SESSIONS_KEY, id], ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Session ouverte.'),
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
    },
  });
}

export function useRecordEntry(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordEntryPayload) => sessionsApi.recordEntry(sessionId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: [...SESSIONS_KEY, sessionId] });
      const previous = queryClient.getQueryData<MonthlySession>([...SESSIONS_KEY, sessionId]);

      queryClient.setQueryData<MonthlySession>([...SESSIONS_KEY, sessionId], (old) => {
        if (!old) return old;

        // Récupère le profil du membre depuis les entrées existantes
        const existingMembership = old.entries?.find(
          (e) => e.membershipId === payload.membershipId,
        )?.membership;

        const tempEntry: SessionEntry = {
          id: `__temp_${Date.now()}`,
          sessionId,
          membershipId: payload.membershipId,
          type: payload.type,
          amount: String(payload.amount),
          loanId: payload.loanId ?? null,
          notes: payload.notes ?? null,
          reference: '',
          isOutOfSession: false,
          outOfSessionAt: null,
          outOfSessionRef: null,
          isImported: false,
          recordedById: '',
          recordedAt: new Date().toISOString(),
          membership: existingMembership ?? undefined,
        };

        // Met à jour le total du type correspondant
        const typeToField: Partial<Record<string, keyof MonthlySession>> = {
          COTISATION:    'totalCotisation',
          INSCRIPTION:   'totalInscription',
          EPARGNE:       'totalEpargne',
          SECOURS:       'totalSecours',
          POT:           'totalPot',
          RBT_PRINCIPAL: 'totalRbtPrincipal',
          RBT_INTEREST:  'totalRbtInterest',
          PROJET:        'totalProjet',
          AUTRES:        'totalAutres',
        };
        const field = typeToField[payload.type];
        const updatedTotals = field
          ? { [field]: String(parseFloat((old[field] as string) || '0') + payload.amount) }
          : {};

        return {
          ...old,
          ...updatedTotals,
          entries: [...(old.entries ?? []), tempEntry],
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData([...SESSIONS_KEY, sessionId], ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Entrée enregistrée.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, sessionId] }),
  });
}

export function useCloseForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.closeForReview(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [...SESSIONS_KEY, id] });
      const previous = queryClient.getQueryData<MonthlySession>([...SESSIONS_KEY, id]);
      queryClient.setQueryData<MonthlySession>([...SESSIONS_KEY, id], (old) =>
        old ? { ...old, status: SessionStatus.REVIEWING } : old,
      );
      return { previous };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData([...SESSIONS_KEY, id], ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Session soumise pour révision.'),
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
    },
  });
}

export function useValidateAndClose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionsApi.validateAndClose(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [...SESSIONS_KEY, id] });
      const previous = queryClient.getQueryData<MonthlySession>([...SESSIONS_KEY, id]);
      queryClient.setQueryData<MonthlySession>([...SESSIONS_KEY, id], (old) =>
        old ? { ...old, status: SessionStatus.CLOSED } : old,
      );
      return { previous };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData([...SESSIONS_KEY, id], ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Session validée et clôturée.'),
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
    },
  });
}
