import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cassationApi } from '@lib/api/cassation.api';

const CASS_KEY = ['cassation'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

export function useCassation(fiscalYearId: string) {
  return useQuery({
    queryKey: [...CASS_KEY, fiscalYearId],
    queryFn: () => cassationApi.getByFiscalYear(fiscalYearId),
    enabled: Boolean(fiscalYearId),
    retry: false,
  });
}

export function useExecuteCassation(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cassationApi.execute(fiscalYearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...CASS_KEY, fiscalYearId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      toast.success('Cassation exécutée avec succès.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
