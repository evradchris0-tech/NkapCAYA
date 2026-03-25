import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loansApi, RequestLoanPayload, ApplyRepaymentPayload } from '@lib/api/loans.api';

const LOANS_KEY = ['loans'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

export function useLoansByMembership(membershipId: string) {
  return useQuery({
    queryKey: [...LOANS_KEY, 'membership', membershipId],
    queryFn: () => loansApi.getByMembership(membershipId),
    enabled: Boolean(membershipId),
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: [...LOANS_KEY, id],
    queryFn: () => loansApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useRequestLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequestLoanPayload) => loansApi.request(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
      toast.success('Demande de prêt soumise.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useApproveLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansApi.approve(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
      queryClient.invalidateQueries({ queryKey: [...LOANS_KEY, id] });
      toast.success('Prêt approuvé.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useApplyRepayment(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyRepaymentPayload) => loansApi.repay(loanId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LOANS_KEY, loanId] });
      toast.success('Remboursement enregistré.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
