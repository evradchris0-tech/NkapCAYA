/**
 * api.types.ts — Source de vérité des types frontend
 * Aligné 1:1 sur database/schema.prisma
 * Les champs Decimal Prisma sont sérialisés en string par JSON.
 */

import type {
  BureauRole,
  TransactionType,
  LoanStatus,
  SessionStatus,
  MemberStatus,
} from './domain.types';

// ─────────────────────────────────────────────────────────
// ENUMS SUPPLÉMENTAIRES (non dans domain.types)
// ─────────────────────────────────────────────────────────

export type FiscalYearStatus = 'PENDING' | 'ACTIVE' | 'CASSATION' | 'CLOSED' | 'ARCHIVED';
export type EnrollmentType = 'NEW' | 'RETURNING' | 'MID_YEAR';
export type BeneficiaryStatus = 'UNASSIGNED' | 'ASSIGNED' | 'DELIVERED';
export type PoolParticipantType = 'RESCUE_FUND' | 'BUREAU';
export type SavingsEntryType = 'DEPOSIT' | 'INTEREST_CREDIT';
export type InterestPoolMethod = 'THEORETICAL' | 'ACTUAL';
export type RescueEventType =
  | 'MEMBER_DEATH'
  | 'RELATIVE_DEATH'
  | 'MARRIAGE'
  | 'BIRTH'
  | 'ILLNESS'
  | 'PROMOTION';

// ─────────────────────────────────────────────────────────
// GENERIC WRAPPERS
// ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────
// MODULE 01 — AUTH
// ─────────────────────────────────────────────────────────

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthUser {
  id: string;
  username: string;
  phone: string;
  role: BureauRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface TokensResponse {
  tokens: AuthTokens;
}

// ─────────────────────────────────────────────────────────
// MODULE 02 — CONFIGURATION
// ─────────────────────────────────────────────────────────

export interface TontineConfig {
  id: string;
  name: string;
  acronym: string;
  foundedYear: number;
  motto: string | null;
  headquartersCity: string | null;
  registrationNumber: string | null;
  // Parts
  shareUnitAmount: string;
  halfShareAmount: string;
  potMonthlyAmount: string;
  maxSharesPerMember: number;
  // Épargne
  mandatoryInitialSavings: string;
  // Prêts
  loanMonthlyRate: string;
  minLoanAmount: string;
  maxLoanAmount: string;
  maxLoanMultiplier: number;
  minSavingsToLoan: string;
  maxConcurrentLoans: number;
  // Secours
  rescueFundTarget: string;
  rescueFundMinBalance: string;
  // Inscription
  registrationFeeNew: string;
  registrationFeeReturning: string;
  // Méta
  updatedAt: string;
  updatedById: string;
}

export interface FiscalYearConfig {
  id: string;
  fiscalYearId: string;
  snapshotAt: string;
  snapshotById: string;
  shareUnitAmount: string;
  loanMonthlyRate: string;
  maxLoanMultiplier: number;
  minSavingsToLoan: string;
  maxConcurrentLoans: number;
  rescueFundTarget: string;
  rescueFundMinBalance: string;
  registrationFeeNew: string;
  registrationFeeReturning: string;
  interestPoolMethod: InterestPoolMethod;
  forcedModifiedAt: string | null;
  forcedModifiedById: string | null;
  forcedModifiedReason: string | null;
}

export interface RescueEventAmount {
  eventType: RescueEventType;
  amount: string;
  label: string;
  updatedById: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// MODULE 03 — MEMBRES
// ─────────────────────────────────────────────────────────

export interface Member {
  id: string;
  memberCode: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone1: string;
  phone2: string | null;
  neighborhood: string;
  locationDetail: string | null;
  mobileMoneyType: string | null;
  mobileMoneyNumber: string | null;
  sponsorId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    phone: string;
    role: string;
    isActive: boolean;
  };
  emergencyContacts?: EmergencyContact[];
}

export interface EmergencyContact {
  id: string;
  profileId: string;
  fullName: string;
  phone: string;
  relation: string | null;
}

export interface CreateMemberResult {
  profile: Member;
  temporaryPassword: string;
}

// ─────────────────────────────────────────────────────────
// MODULE 04 — EXERCICE FISCAL
// ─────────────────────────────────────────────────────────

export interface FiscalYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  cassationDate: string;
  loanDueDate: string;
  status: FiscalYearStatus;
  openedAt: string | null;
  openedById: string | null;
  closedAt: string | null;
  closedById: string | null;
  notes: string | null;
  config?: FiscalYearConfig;
}

export interface Membership {
  id: string;
  profileId: string;
  fiscalYearId: string;
  status: MemberStatus;
  joinedAt: string;
  joinedAtMonth: number;
  enrollmentType: EnrollmentType;
  catchUpAmount: string;
  catchUpPaid: boolean;
  registrationFeePaid: boolean;
  rescueContribPaid: boolean;
  initialSavingsPaid: boolean;
  profile?: Pick<Member, 'id' | 'firstName' | 'lastName' | 'memberCode'>;
  shareCommitment?: ShareCommitment;
}

export interface ShareCommitment {
  id: string;
  membershipId: string;
  sharesCount: string;
  monthlyAmount: string;
  isLocked: boolean;
  lockedAt: string | null;
  lockedById: string | null;
}

// Alias pour les hooks existants (compatibilité)
export type FiscalYearMembership = Membership;

// ─────────────────────────────────────────────────────────
// MODULE 05 — SESSIONS & TRANSACTIONS
// ─────────────────────────────────────────────────────────

export interface MonthlySession {
  id: string;
  fiscalYearId: string;
  sessionNumber: number;
  meetingDate: string;
  location: string | null;
  hostMembershipId: string | null;
  status: SessionStatus;
  openedAt: string | null;
  openedById: string | null;
  closedAt: string | null;
  closedById: string | null;
  // Totaux snapshot
  totalInscription: string;
  totalSecours: string;
  totalCotisation: string;
  totalPot: string;
  totalRbtPrincipal: string;
  totalRbtInterest: string;
  totalEpargne: string;
  totalProjet: string;
  totalAutres: string;
  entries?: SessionEntry[];
  fiscalYear?: { config?: FiscalYearConfig };
}

export interface SessionEntry {
  id: string;
  reference: string;
  sessionId: string | null;
  membershipId: string;
  type: TransactionType;
  amount: string;
  loanId: string | null;
  isOutOfSession: boolean;
  outOfSessionAt: string | null;
  outOfSessionRef: string | null;
  isImported: boolean;
  notes: string | null;
  recordedById: string;
  recordedAt: string;
  membership?: { profile?: Pick<Member, 'id' | 'firstName' | 'lastName' | 'memberCode'> | null };
}

// ─────────────────────────────────────────────────────────
// MODULE 06 — ÉPARGNE & INTÉRÊTS
// ─────────────────────────────────────────────────────────

/** Vue agrégée retournée par GET /savings/summary */
export interface SavingsSummary {
  totalSavings: string;
  totalInterests: string;
  memberBreakdown: Array<{
    membershipId: string;
    memberName: string;
    savings: string;
    interests: string;
  }>;
}

/** @deprecated Utiliser InterestAllocation */
export interface InterestEntry {
  id: string;
  membershipId: string;
  year: number;
  amount: string;
  rate: string;
  calculatedAt: string;
}

export interface SavingsLedger {
  id: string;
  membershipId: string;
  balance: string;
  principalBalance: string;
  totalInterestReceived: string;
  lastUpdatedAt: string;
  entries?: SavingsEntry[];
}

export interface SavingsEntry {
  id: string;
  ledgerId: string;
  sessionId: string | null;
  sessionEntryId: string | null;
  month: number;
  amount: string;
  type: SavingsEntryType;
  balanceAfter: string;
  createdAt: string;
}

export interface PoolParticipant {
  id: string;
  fiscalYearId: string;
  type: PoolParticipantType;
  label: string;
  initialBalance: string;
  currentBalance: string;
  totalInterestReceived: string;
}

export interface InterestDistributionSnapshot {
  id: string;
  sessionId: string;
  totalInterestPool: string;
  totalSavingsBase: string;
  distributedAt: string;
  executedById: string;
  allocations?: InterestAllocation[];
}

export interface InterestAllocation {
  id: string;
  snapshotId: string;
  membershipId: string;
  savingsBalance: string;
  allocationAmount: string;
}

// ─────────────────────────────────────────────────────────
// MODULE 07 — PRÊTS
// ─────────────────────────────────────────────────────────

export interface LoanAccount {
  id: string;
  membershipId: string;
  fiscalYearId: string;
  principalAmount: string;
  monthlyRate: string;
  disbursedAt: string | null;
  disbursedById: string | null;
  dueBeforeDate: string;
  status: LoanStatus;
  outstandingBalance: string;
  totalInterestAccrued: string;
  totalRepaid: string;
  requestedAt: string;
  requestNotes: string | null;
  monthlyAccruals?: MonthlyLoanAccrual[];
  repayments?: LoanRepayment[];
  membership?: Pick<Member, 'id' | 'firstName' | 'lastName' | 'memberCode'>;
}

export interface MonthlyLoanAccrual {
  id: string;
  loanId: string;
  sessionId: string;
  month: number;
  balanceAtMonthStart: string;
  interestAccrued: string;
  balanceWithInterest: string;
  repaymentReceived: string;
  balanceAtMonthEnd: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  sessionId: string;
  sessionEntryId?: string | null;
  amount: string;
  principalPart: string;
  interestPart: string;
  balanceAfter: string;
  recordedAt: string;
}

export interface CarryoverLoanRecord {
  id: string;
  originalLoanId: string;
  newFiscalYearId: string;
  carryoverAmount: string;
  reason: string | null;
  approvedById: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// MODULE 08 — CAISSE DE SECOURS
// ─────────────────────────────────────────────────────────

export interface RescueFundLedger {
  id: string;
  fiscalYearId: string;
  totalBalance: string;
  targetPerMember: string;
  minimumPerMember: string;
  memberCount: number;
  targetTotal: string;
  events?: RescueFundEvent[];
  positions?: RescueFundPosition[];
}

export interface RescueFundEvent {
  id: string;
  ledgerId: string;
  beneficiaryId: string;
  eventType: RescueEventType;
  amount: string;
  authorizedById: string;
  eventDate: string;
  description: string | null;
  createdAt: string;
}

export interface RescueFundPosition {
  id: string;
  membershipId: string;
  ledgerId: string;
  paidAmount: string;
  balance: string;
  refillDebt: string;
  lastUpdatedAt: string;
}

// ─────────────────────────────────────────────────────────
// MODULE 09 — BÉNÉFICIAIRES
// ─────────────────────────────────────────────────────────

export interface BeneficiarySchedule {
  id: string;
  fiscalYearId: string;
  createdAt: string;
  slots?: BeneficiarySlot[];
}

export interface BeneficiarySlot {
  id: string;
  scheduleId: string;
  sessionId: string;
  month: number;
  slotIndex: number;
  membershipId: string | null;
  amountDelivered: string;
  designatedById: string | null;
  designatedAt: string | null;
  status: BeneficiaryStatus;
  deliveredAt: string | null;
  isHost: boolean;
  notes: string | null;
  membership?: {
    profile?: Pick<Member, 'id' | 'firstName' | 'lastName' | 'memberCode'>;
  };
}

// ─────────────────────────────────────────────────────────
// MODULE 10 — CASSATION
// ─────────────────────────────────────────────────────────

export interface CassationRecord {
  id: string;
  fiscalYearId: string;
  executedAt: string;
  executedById: string;
  totalSavingsReturned: string;
  totalInterestReturned: string;
  totalDistributed: string;
  memberCount: number;
  carryoverCount: number;
  notes: string | null;
  redistributions?: CassationRedistribution[];
  participantShares?: PoolParticipantCassationShare[];
}

export interface CassationRedistribution {
  id: string;
  cassationId: string;
  membershipId: string;
  savingsAmount: string;
  interestAmount: string;
  totalReturned: string;
  membership?: { 
    profile?: Pick<Member, 'id' | 'firstName' | 'lastName' | 'memberCode'>;
  };
}

export interface PoolParticipantCassationShare {
  id: string;
  cassationId: string;
  participantId: string;
  participantType: PoolParticipantType;
  principalAmount: string;
  interestEarned: string;
  totalDistributed: string;
}

// ─────────────────────────────────────────────────────────
// LEGACY ALIASES (compatibilité avec les hooks existants)
// ─────────────────────────────────────────────────────────

/** @deprecated Utiliser MonthlySession */
export type Session = MonthlySession;

/** @deprecated Utiliser SessionEntry */
export type Transaction = SessionEntry;

/** @deprecated Utiliser LoanAccount */
export type Loan = LoanAccount;
