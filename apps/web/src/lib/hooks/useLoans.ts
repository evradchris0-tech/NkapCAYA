import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loansApi, RequestLoanPayload, ApplyRepaymentPayload } from '@lib/api/loans.api';
import type { LoanAccount } from '@/types/api.types';
import { LoanStatus } from '@/types/domain.types';

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

export function useFiscalYearLoans(fiscalYearId: string) {
  return useQuery({
    queryKey: [...LOANS_KEY, 'fiscal-year', fiscalYearId],
    queryFn: () => loansApi.getByFiscalYear(fiscalYearId),
    enabled: Boolean(fiscalYearId),
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

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [...LOANS_KEY, id] });
      const previous = queryClient.getQueryData<LoanAccount>([...LOANS_KEY, id]);
      queryClient.setQueryData<LoanAccount>([...LOANS_KEY, id], (old) =>
        old ? { ...old, status: LoanStatus.ACTIVE } : old,
      );
      return { previous };
    },
    onError: (_err, id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData([...LOANS_KEY, id], ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Prêt approuvé.'),
    onSettled: (_data, _err, id) => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
      queryClient.invalidateQueries({ queryKey: [...LOANS_KEY, id] });
    },
  });
}

export function useApplyRepayment(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyRepaymentPayload) => loansApi.repay(loanId, payload),

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: [...LOANS_KEY, loanId] });
      const previous = queryClient.getQueryData<LoanAccount>([...LOANS_KEY, loanId]);
      queryClient.setQueryData<LoanAccount>([...LOANS_KEY, loanId], (old) => {
        if (!old) return old;
        const newBalance = Math.max(0, parseFloat(old.outstandingBalance) - payload.amount);
        const newRepaid = parseFloat(old.totalRepaid) + payload.amount;
        const newStatus: LoanStatus = newBalance <= 0
          ? LoanStatus.CLOSED
          : LoanStatus.PARTIALLY_REPAID;
        return {
          ...old,
          outstandingBalance: String(newBalance),
          totalRepaid: String(newRepaid),
          status: newStatus,
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData([...LOANS_KEY, loanId], ctx.previous);
      toast.error(apiError(_err));
    },
    onSuccess: () => toast.success('Remboursement enregistré.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...LOANS_KEY, loanId] }),
  });
}
