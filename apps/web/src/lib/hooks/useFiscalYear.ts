import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  fiscalYearApi,
  CreateFiscalYearPayload,
  UpdateFiscalYearPayload,
  AddMemberPayload,
  UpdateMembershipPayload,
} from '@lib/api/fiscal-year.api';

const FY_KEY = ['fiscal-years'] as const;

const apiError = (error: unknown): string => {
  const msg = (error as any)?.response?.data?.message ?? 'Une erreur est survenue.';
  return Array.isArray(msg) ? msg[0] : msg;
};

export function useFiscalYears() {
  return useQuery({
    queryKey: FY_KEY,
    queryFn: () => fiscalYearApi.getAll(),
  });
}

export function useFiscalYear(id: string) {
  return useQuery({
    queryKey: [...FY_KEY, id],
    queryFn: () => fiscalYearApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useFiscalYearMemberships(id: string) {
  return useQuery({
    queryKey: [...FY_KEY, id, 'memberships'],
    queryFn: () => fiscalYearApi.getMemberships(id),
    enabled: Boolean(id),
  });
}

export function useCreateFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFiscalYearPayload) => fiscalYearApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FY_KEY });
      toast.success('Exercice fiscal créé.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useCloseFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FY_KEY });
      toast.success('Exercice fiscal clôturé.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useUpdateFiscalYear(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFiscalYearPayload) => fiscalYearApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FY_KEY });
      toast.success('Exercice fiscal modifié.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useDeleteFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FY_KEY });
      toast.success('Exercice fiscal supprimé.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useActivateFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FY_KEY });
      toast.success('Exercice fiscal activé.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useOpenCassation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.openCassation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FY_KEY });
      toast.success('Cassation ouverte.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useUpdateMembership(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, payload }: { membershipId: string; payload: UpdateMembershipPayload }) =>
      fiscalYearApi.updateMembership(fiscalYearId, membershipId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FY_KEY, fiscalYearId, 'memberships'] });
      toast.success('Inscription mise à jour.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}

export function useAddMember(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMemberPayload) => fiscalYearApi.addMember(fiscalYearId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FY_KEY, fiscalYearId, 'memberships'] });
      queryClient.invalidateQueries({ queryKey: [...FY_KEY, fiscalYearId] });
      toast.success('Membre inscrit à l\'exercice.');
    },
    onError: (error) => toast.error(apiError(error)),
  });
}
