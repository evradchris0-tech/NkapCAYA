import { useQuery } from '@tanstack/react-query';
import { savingsApi } from '@lib/api/savings.api';

const SAVINGS_KEY = ['savings'] as const;

export function useSavingsByMembership(membershipId: string) {
  return useQuery({
    queryKey: [...SAVINGS_KEY, membershipId],
    queryFn: () => savingsApi.getByMembership(membershipId),
    enabled: Boolean(membershipId),
  });
}

export function useFiscalYearSavings(fiscalYearId: string) {
  return useQuery({
    queryKey: [...SAVINGS_KEY, 'fy', fiscalYearId],
    queryFn: () => savingsApi.getFiscalYearBalances(fiscalYearId),
    enabled: Boolean(fiscalYearId),
  });
}
