import type {
  TransactionType,
  LoanStatus,
  SessionStatus,
  BureauRole,
} from './domain.types';

// ── Generic wrappers ──────────────────────────────────────────────────────────

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

// ── Auth ──────────────────────────────────────────────────────────────────────

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

// ── Member ────────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  memberCode: string;
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
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  month: number;
  year: number;
  date: string;
  status: SessionStatus;
  totalCollected: number;
  transactions: Transaction[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  sessionId: string;
  memberId: string;
  member?: Pick<Member, 'id' | 'firstName' | 'lastName'>;
  type: TransactionType;
  amount: number;
  note?: string;
  createdAt: string;
}

// ── Savings ───────────────────────────────────────────────────────────────────

export interface SavingsSummary {
  totalSavings: number;
  totalInterests: number;
  memberBreakdown: Array<{
    memberId: string;
    memberName: string;
    savings: number;
    interests: number;
  }>;
}

export interface InterestEntry {
  id: string;
  memberId: string;
  year: number;
  amount: number;
  rate: number;
  calculatedAt: string;
}

// ── Loan ──────────────────────────────────────────────────────────────────────

export interface Loan {
  id: string;
  memberId: string;
  member?: Pick<Member, 'id' | 'firstName' | 'lastName'>;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  amountRepaid: number;
  amountDue: number;
  purpose?: string;
  createdAt: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  amount: number;
  repaidAt: string;
}
