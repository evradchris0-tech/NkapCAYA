// ── Enums — alignés sur database/schema.prisma ─────────────────────────────

export enum BureauRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  TRESORIER = 'TRESORIER',
  TRESORIER_ADJOINT = 'TRESORIER_ADJOINT',
  SECRETAIRE_GENERAL = 'SECRETAIRE_GENERAL',
  SECRETAIRE_ADJOINT = 'SECRETAIRE_ADJOINT',
  COMMISSAIRE_AUX_COMPTES = 'COMMISSAIRE_AUX_COMPTES',
  MEMBRE = 'MEMBRE',
}

export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXCLUDED = 'EXCLUDED',
}

export enum TransactionType {
  INSCRIPTION = 'INSCRIPTION',
  SECOURS = 'SECOURS',
  COTISATION = 'COTISATION',
  POT = 'POT',
  RBT_PRINCIPAL = 'RBT_PRINCIPAL',
  RBT_INTEREST = 'RBT_INTEREST',
  EPARGNE = 'EPARGNE',
  PROJET = 'PROJET',
  AUTRES = 'AUTRES',
}

export enum LoanStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PARTIALLY_REPAID = 'PARTIALLY_REPAID',
  CLOSED = 'CLOSED',
}

export enum SessionStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  REVIEWING = 'REVIEWING',
  CLOSED = 'CLOSED',
}

// ── Value object helpers ──────────────────────────────────────────────────────

export const BUREAU_ROLE_LABELS: Record<BureauRole, string> = {
  [BureauRole.SUPER_ADMIN]: 'Super Admin',
  [BureauRole.PRESIDENT]: 'Président',
  [BureauRole.VICE_PRESIDENT]: 'Vice-Président',
  [BureauRole.TRESORIER]: 'Trésorier',
  [BureauRole.TRESORIER_ADJOINT]: 'Trésorier Adjoint',
  [BureauRole.SECRETAIRE_GENERAL]: 'Secrétaire Général',
  [BureauRole.SECRETAIRE_ADJOINT]: 'Secrétaire Adjoint',
  [BureauRole.COMMISSAIRE_AUX_COMPTES]: 'Commissaire aux Comptes',
  [BureauRole.MEMBRE]: 'Membre',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.INSCRIPTION]: 'Inscription',
  [TransactionType.SECOURS]: 'Caisse de secours',
  [TransactionType.COTISATION]: 'Cotisation',
  [TransactionType.POT]: 'Pot',
  [TransactionType.RBT_PRINCIPAL]: 'Remboursement Principal',
  [TransactionType.RBT_INTEREST]: 'Remboursement Intérêts',
  [TransactionType.EPARGNE]: 'Épargne',
  [TransactionType.PROJET]: 'Projet',
  [TransactionType.AUTRES]: 'Autres',
};

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  [LoanStatus.PENDING]: 'En attente',
  [LoanStatus.ACTIVE]: 'En cours',
  [LoanStatus.PARTIALLY_REPAID]: 'Partiellement remboursé',
  [LoanStatus.CLOSED]: 'Clôturé',
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'Actif',
  [MemberStatus.INACTIVE]: 'Inactif',
  [MemberStatus.SUSPENDED]: 'Suspendu',
  [MemberStatus.EXCLUDED]: 'Exclu',
};
