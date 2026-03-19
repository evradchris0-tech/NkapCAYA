import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, CreateMemberPayload } from '@lib/api/members.api';

const MEMBERS_KEY = ['members'] as const;

export function useMembers(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...MEMBERS_KEY, params],
    queryFn: () => membersApi.getAll(params),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: [...MEMBERS_KEY, id],
    queryFn: () => membersApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMemberPayload) => membersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateMemberPayload>;
    }) => membersApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...MEMBERS_KEY, variables.id] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}
