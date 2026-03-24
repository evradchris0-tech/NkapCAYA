import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi, CreateMemberPayload, AddEmergencyContactPayload } from '@lib/api/members.api';

const MEMBERS_KEY = ['members'] as const;

export function useMembers(params?: { page?: number; limit?: number; search?: string; role?: string; isActive?: boolean }) {
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
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateMemberPayload> }) =>
      membersApi.update(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...MEMBERS_KEY, variables.id] });
    },
  });
}

export function useDeactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
  });
}

export function useReactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.reactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...MEMBERS_KEY, id] });
    },
  });
}

export function useEmergencyContacts(memberId: string) {
  return useQuery({
    queryKey: [...MEMBERS_KEY, memberId, 'emergency-contacts'],
    queryFn: () => membersApi.getEmergencyContacts(memberId),
    enabled: Boolean(memberId),
  });
}

export function useAddEmergencyContact(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddEmergencyContactPayload) =>
      membersApi.addEmergencyContact(memberId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEMBERS_KEY, memberId, 'emergency-contacts'],
      });
    },
  });
}

export function useRemoveEmergencyContact(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) =>
      membersApi.removeEmergencyContact(memberId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...MEMBERS_KEY, memberId, 'emergency-contacts'],
      });
    },
  });
}

export function useMemberMemberships(memberId: string) {
  return useQuery({
    queryKey: [...MEMBERS_KEY, memberId, 'memberships'],
    queryFn: () => membersApi.getMemberships(memberId),
    enabled: Boolean(memberId),
  });
}

export function useChangeRole(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role: string) => membersApi.changeRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      queryClient.invalidateQueries({ queryKey: [...MEMBERS_KEY, memberId] });
    },
  });
}
