import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beneficiariesApi } from '@lib/api/beneficiaries.api';

const BENE_KEY = ['beneficiaries'] as const;

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...BENE_KEY, fiscalYearId] }),
  });
}

export function useMarkDelivered(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => beneficiariesApi.markDelivered(fiscalYearId, slotId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...BENE_KEY, fiscalYearId] }),
  });
}
