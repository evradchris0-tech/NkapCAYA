// ── Enums ─────────────────────────────────────────────────────────────────────

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum TransactionType {
  EPARGNE = 'EPARGNE',
  TONTINE = 'TONTINE',
  INTERET = 'INTERET',
  SECOURS = 'SECOURS',
  PRET_REMBOURSEMENT = 'PRET_REMBOURSEMENT',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED',
}

export enum SessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

// ── Value object helpers ──────────────────────────────────────────────────────

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.EPARGNE]: 'Épargne',
  [TransactionType.TONTINE]: 'Tontine',
  [TransactionType.INTERET]: 'Intérêt',
  [TransactionType.SECOURS]: 'Caisse de secours',
  [TransactionType.PRET_REMBOURSEMENT]: 'Remboursement prêt',
};

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  [LoanStatus.PENDING]: 'En attente',
  [LoanStatus.APPROVED]: 'Approuvé',
  [LoanStatus.ACTIVE]: 'En cours',
  [LoanStatus.COMPLETED]: 'Terminé',
  [LoanStatus.DEFAULTED]: 'Défaut',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'Actif',
  [MemberStatus.INACTIVE]: 'Inactif',
  [MemberStatus.SUSPENDED]: 'Suspendu',
};
