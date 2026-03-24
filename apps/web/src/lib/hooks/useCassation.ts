import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cassationApi } from '@lib/api/cassation.api';

const CASS_KEY = ['cassation'] as const;

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
    },
  });
}
