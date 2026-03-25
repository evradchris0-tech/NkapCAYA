import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { beneficiariesApi } from '@lib/api/beneficiaries.api';

const BENE_KEY = ['beneficiaries'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

export function useBeneficiarySchedule(fiscalYearId: string) {
  return useQuery({
    queryKey: [...BENE_KEY, fiscalYearId],
    queryFn: () => beneficiariesApi.getSchedule(fiscalYearId),
    enabled: Boolean(fiscalYearId),
  });
}

export function useAssignSlot(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, membershipId }: { slotId: string; membershipId: string }) =>
      beneficiariesApi.assignSlot(fiscalYearId, slotId, membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...BENE_KEY, fiscalYearId] });
      toast.success('Bénéficiaire assigné.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useMarkDelivered(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => beneficiariesApi.markDelivered(fiscalYearId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...BENE_KEY, fiscalYearId] });
      toast.success('Pot marqué comme remis.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
