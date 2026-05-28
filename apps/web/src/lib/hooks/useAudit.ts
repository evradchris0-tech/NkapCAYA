import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit.api';

export function useAuditLogs(params: { page?: number; limit?: number; entityType?: string; actorId?: string }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => auditApi.findAll(params),
  });
}
