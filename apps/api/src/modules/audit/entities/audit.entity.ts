export class AuditEntity {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData: any | null;
  afterData: any | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  version: number;

  actor?: {
    id: string;
    username: string;
    role: string;
  };
}
