import {
  classifySpecialAccount,
  reconstructLoanTimeline,
  SPECIAL_POOL_LABELS,
  SPECIAL_SHEET_LABELS,
} from './import.helpers';

describe('import.helpers', () => {
  describe('classifySpecialAccount()', () => {
    it('IH01 — reconnaît SECOURS / CAYA comme RESCUE_FUND', () => {
      expect(classifySpecialAccount('SECOURS / CAYA')).toBe('RESCUE_FUND');
      expect(classifySpecialAccount('secours/caya')).toBe('RESCUE_FUND');
      expect(classifySpecialAccount('Caisse de secours')).toBe('RESCUE_FUND');
      expect(classifySpecialAccount('Réserve')).toBe('RESCUE_FUND');
    });

    it('IH02 — reconnaît BUREAU', () => {
      expect(classifySpecialAccount('BUREAU')).toBe('BUREAU');
      expect(classifySpecialAccount('  bureau ')).toBe('BUREAU');
    });

    it('IH03 — reconnaît AUTRES / FETE', () => {
      expect(classifySpecialAccount('AUTRES / FETE')).toBe('AUTRES_FETE');
      expect(classifySpecialAccount('autres / fête')).toBe('AUTRES_FETE');
      expect(classifySpecialAccount('Divers')).toBe('AUTRES_FETE');
    });

    it('IH04 — un vrai membre renvoie null', () => {
      expect(classifySpecialAccount('ABENG ZE Jean Claude')).toBeNull();
      expect(classifySpecialAccount('NSOA MBONDO Pierre')).toBeNull();
      expect(classifySpecialAccount('OMGBA FOUDA Simon Pierre')).toBeNull();
    });

    it('IH05 — ne confond pas "bureau" inclus dans un mot', () => {
      // garde-fou : "bureau" doit être un mot isolé
      expect(classifySpecialAccount('BUREAUCRATE Jean')).toBeNull();
    });

    it('IH06 — libellés de pool et de feuille cohérents', () => {
      expect(SPECIAL_POOL_LABELS.RESCUE_FUND).toBe('Caisse de secours');
      expect(SPECIAL_POOL_LABELS.BUREAU).toBe('Bureau');
      expect(SPECIAL_POOL_LABELS.AUTRES_FETE).toBe('Autres / Fête');
      expect(SPECIAL_SHEET_LABELS.RESCUE_FUND).toBe('SECOURS / CAYA');
      expect(SPECIAL_SHEET_LABELS.AUTRES_FETE).toBe('AUTRES / FETE');
    });
  });

  describe('reconstructLoanTimeline()', () => {
    it('IH07 — entrée vide → timeline vide', () => {
      expect(reconstructLoanTimeline({ disbursements: {}, interests: {}, repayments: {} })).toEqual([]);
    });

    it('IH08 — décaissement + intérêt, aucun remboursement', () => {
      const t = reconstructLoanTimeline({
        disbursements: { 1: 100000 },
        interests: { 1: 4000 },
        repayments: {},
      });
      expect(t).toHaveLength(1);
      expect(t[0]).toMatchObject({
        month: 1,
        balanceAtMonthStart: 100000,
        interestAccrued: 4000,
        balanceWithInterest: 104000,
        repaymentReceived: 0,
        balanceAtMonthEnd: 104000,
        interestPart: 0,
        principalPart: 0,
      });
    });

    it('IH09 — remboursement éteint l’intérêt puis le principal, solde décroît', () => {
      const t = reconstructLoanTimeline({
        disbursements: { 1: 100000 },
        interests: { 1: 4000, 2: 3000 },
        repayments: { 2: 54000 },
      });
      // Mois 1 : 100000 + 4000 = 104000, pas de remboursement
      expect(t[0].balanceAtMonthEnd).toBe(104000);
      // Mois 2 : start 104000, +3000 = 107000, remb 54000 (3000 intérêt + 51000 principal)
      const m2 = t.find((x) => x.month === 2)!;
      expect(m2.balanceAtMonthStart).toBe(104000);
      expect(m2.balanceWithInterest).toBe(107000);
      expect(m2.interestPart).toBe(3000);
      expect(m2.principalPart).toBe(51000);
      expect(m2.balanceAtMonthEnd).toBe(53000);
    });

    it('IH10 — un remboursement seul (sans intérêt) est 100% principal', () => {
      const t = reconstructLoanTimeline({
        disbursements: { 1: 50000 },
        interests: {},
        repayments: { 3: 20000 },
      });
      const m3 = t.find((x) => x.month === 3)!;
      expect(m3.interestPart).toBe(0);
      expect(m3.principalPart).toBe(20000);
      expect(m3.balanceAtMonthEnd).toBe(30000);
    });

    it('IH11 — le solde ne devient jamais négatif', () => {
      const t = reconstructLoanTimeline({
        disbursements: { 1: 10000 },
        interests: {},
        repayments: { 2: 999999 },
      });
      const last = t[t.length - 1];
      expect(last.balanceAtMonthEnd).toBeGreaterThanOrEqual(0);
    });

    it('IH12 — ignore les mois hors plage 1..12', () => {
      const t = reconstructLoanTimeline({
        disbursements: { 0: 5000, 13: 5000, 1: 100000 },
        interests: {},
        repayments: {},
      });
      expect(t.map((x) => x.month)).toEqual([1]);
    });
  });
});
