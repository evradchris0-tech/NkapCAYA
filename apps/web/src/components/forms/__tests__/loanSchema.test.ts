import { describe, it, expect } from 'vitest';
import { loanSchema } from '@/lib/schemas/loan.schema';

const valid = {
  memberId: 'mem-1',
  amount: 100000,
  interestRate: 4,
  durationMonths: 12,
  startDate: '2025-01-01',
};

describe('loanSchema', () => {
  it('S01 — accepte un payload valide', () => {
    const result = loanSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('S02 — coerce les strings en number pour amount', () => {
    const result = loanSchema.safeParse({ ...valid, amount: '100000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(100000);
  });

  it('S03 — rejette amount = 0 (non positif)', () => {
    const result = loanSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('amount');
    }
  });

  it('S04 — rejette interestRate > 100', () => {
    const result = loanSchema.safeParse({ ...valid, interestRate: 101 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('interestRate');
    }
  });

  it('S05 — accepte purpose optionnel absent', () => {
    const { purpose: _, ...withoutPurpose } = { ...valid, purpose: undefined };
    const result = loanSchema.safeParse(withoutPurpose);
    expect(result.success).toBe(true);
  });

  it('S06 — rejette memberId vide', () => {
    const result = loanSchema.safeParse({ ...valid, memberId: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('memberId');
    }
  });
});
