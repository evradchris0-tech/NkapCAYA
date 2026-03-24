import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fiscalYearApi,
  CreateFiscalYearPayload,
  AddMemberPayload,
} from '@lib/api/fiscal-year.api';

const FY_KEY = ['fiscal-years'] as const;

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FY_KEY }),
  });
}

export function useActivateFiscalYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FY_KEY }),
  });
}

export function useOpenCassation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fiscalYearApi.openCassation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FY_KEY }),
  });
}

export function useAddMember(fiscalYearId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMemberPayload) => fiscalYearApi.addMember(fiscalYearId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...FY_KEY, fiscalYearId, 'memberships'] });
      queryClient.invalidateQueries({ queryKey: [...FY_KEY, fiscalYearId] });
    },
  });
}
