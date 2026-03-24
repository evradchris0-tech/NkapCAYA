import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi, UpdateConfigPayload } from '@lib/api/config.api';
import type { RescueEventType } from '@/types/api.types';

const CONFIG_KEY = ['config'] as const;
const RESCUE_AMOUNTS_KEY = ['config', 'rescue-events'] as const;

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_KEY }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESCUE_AMOUNTS_KEY }),
  });
}
