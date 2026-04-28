import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { beneficiariesApi } from '@lib/api/beneficiaries.api';
import type { BeneficiarySchedule } from '@/types/api.types';

const BENE_KEY = ['beneficiaries'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

function fyKey(fiscalYearId: string) {
  return [...BENE_KEY, fiscalYearId] as const;
}

export function useBeneficiarySchedule(fiscalYearId: string, status?: string) {
  return useQuery({
    queryKey: fyKey(fiscalYearId),
    queryFn: () => beneficiariesApi.getSchedule(fiscalYearId).catch((err) => {
      // Pour un exercice PENDING, le schedule n'existe pas encore => 404 (Normal)
      if (err?.response?.status === 404) return null;
      throw err;
    }),
    enabled: Boolean(fiscalYearId) && status !== 'PENDING',
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    }
  });
}

export function useAssignSlot(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slotId,
      membershipId,
      isHost,
    }: {
      slotId: string;
      membershipId: string;
      isHost?: boolean;
    }) => beneficiariesApi.assignSlot(fiscalYearId, slotId, membershipId, isHost),

    onMutate: async ({ slotId, membershipId }) => {
      await queryClient.cancelQueries({ queryKey: fyKey(fiscalYearId) });
      const previous = queryClient.getQueryData<BeneficiarySchedule>(fyKey(fiscalYearId));
      queryClient.setQueryData<BeneficiarySchedule>(fyKey(fiscalYearId), (old) => {
        if (!old) return old;
        return {
          ...old,
          slots: (old.slots ?? []).map((s) =>
            s.id === slotId ? { ...s, membershipId, status: 'ASSIGNED' as const } : s,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(fyKey(fiscalYearId), ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Bénéficiaire assigné.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: fyKey(fiscalYearId) }),
  });
}

export function useMarkDelivered(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, amount }: { slotId: string; amount?: number }) =>
      beneficiariesApi.markDelivered(fiscalYearId, slotId, amount),

    onMutate: async ({ slotId, amount }) => {
      await queryClient.cancelQueries({ queryKey: fyKey(fiscalYearId) });
      const previous = queryClient.getQueryData<BeneficiarySchedule>(fyKey(fiscalYearId));
      queryClient.setQueryData<BeneficiarySchedule>(fyKey(fiscalYearId), (old) => {
        if (!old) return old;
        return {
          ...old,
          slots: (old.slots ?? []).map((s) =>
            s.id === slotId
              ? { ...s, status: 'DELIVERED' as const, amountDelivered: String(amount ?? s.amountDelivered) }
              : s,
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(fyKey(fiscalYearId), ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Pot marqué comme remis.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: fyKey(fiscalYearId) }),
  });
}

export function useSetHost(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => beneficiariesApi.setHost(fiscalYearId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fyKey(fiscalYearId) });
      toast.success('Hôte mis à jour.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useAddSlotToSession(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      beneficiariesApi.addSlotToSession(fiscalYearId, sessionId),

    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: fyKey(fiscalYearId) });
      const previous = queryClient.getQueryData<BeneficiarySchedule>(fyKey(fiscalYearId));
      queryClient.setQueryData<BeneficiarySchedule>(fyKey(fiscalYearId), (old) => {
        if (!old) return old;
        const sessionSlots = (old.slots ?? []).filter((s) => s.sessionId === sessionId);
        const maxIndex = sessionSlots.reduce((m, s) => Math.max(m, s.slotIndex), 0);
        const month = sessionSlots[0]?.month ?? 0;
        const tempSlot: import('@/types/api.types').BeneficiarySlot = {
          id: `__temp_${Date.now()}`,
          scheduleId: old.id,
          sessionId,
          membershipId: null,
          membership: undefined,
          slotIndex: maxIndex + 1,
          month,
          isHost: false,
          status: 'UNASSIGNED' as const,
          amountDelivered: '0',
          designatedById: null,
          designatedAt: null,
          deliveredAt: null,
          notes: null,
        };
        return { ...old, slots: [...(old.slots ?? []), tempSlot] };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(fyKey(fiscalYearId), ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Slot bénéficiaire ajouté.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: fyKey(fiscalYearId) }),
  });
}

export function useRemoveSlot(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => beneficiariesApi.removeSlot(fiscalYearId, slotId),

    onMutate: async (slotId) => {
      await queryClient.cancelQueries({ queryKey: fyKey(fiscalYearId) });
      const previous = queryClient.getQueryData<BeneficiarySchedule>(fyKey(fiscalYearId));
      queryClient.setQueryData<BeneficiarySchedule>(fyKey(fiscalYearId), (old) => {
        if (!old) return old;
        return { ...old, slots: (old.slots ?? []).filter((s) => s.id !== slotId) };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(fyKey(fiscalYearId), ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Bénéficiaire retiré.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: fyKey(fiscalYearId) }),
  });
}
