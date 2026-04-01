import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { configApi, UpdateConfigPayload } from '@lib/api/config.api';
import type { RescueEventType } from '@/types/api.types';

const CONFIG_KEY = ['config'] as const;
const RESCUE_AMOUNTS_KEY = ['config', 'rescue-events'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

export function useConfig() {
  return useQuery({
    queryKey: CONFIG_KEY,
    queryFn: () => configApi.getConfig(),
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateConfigPayload) => configApi.updateConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
      toast.success('Configuration mise à jour.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useRescueEventAmounts() {
  return useQuery({
    queryKey: RESCUE_AMOUNTS_KEY,
    queryFn: () => configApi.getRescueEventAmounts(),
  });
}

export function useUpdateRescueEventAmount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventType, amount }: { eventType: RescueEventType; amount: number }) =>
      configApi.updateRescueEventAmount(eventType, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESCUE_AMOUNTS_KEY });
      toast.success('Montant mis à jour.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
