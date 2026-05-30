/**
 * import.helpers.ts — Fonctions pures réutilisables par l'import d'exercice CAYABASE.
 *
 * Extraites du service pour être testables unitairement (le service lui-même
 * tourne dans une grosse transaction Prisma difficile à mocker finement).
 */

export type SpecialAccountKind = 'RESCUE_FUND' | 'BUREAU' | 'AUTRES_FETE';

/** Libellés d'affichage des comptes de pool, alignés sur le modèle CAYABASE. */
export const SPECIAL_POOL_LABELS: Record<SpecialAccountKind, string> = {
  RESCUE_FUND: 'Caisse de secours',
  BUREAU: 'Bureau',
  AUTRES_FETE: 'Autres / Fête',
};

/** Libellés tels qu'écrits dans la feuille ep+int (pour le ré-export fidèle). */
export const SPECIAL_SHEET_LABELS: Record<SpecialAccountKind, string> = {
  RESCUE_FUND: 'SECOURS / CAYA',
  BUREAU: 'BUREAU',
  AUTRES_FETE: 'AUTRES / FETE',
};

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Classe un libellé comme poste comptable spécial (non-membre).
 * Garde-fou côté serveur : même si le parseur a déjà filtré, on ne veut
 * jamais transformer "SECOURS / CAYA", "BUREAU" ou "AUTRES / FETE" en membre.
 */
export function classifySpecialAccount(name: string): SpecialAccountKind | null {
  const n = norm(name);
  if (/(^|[^a-z])bureau([^a-z]|$)/.test(n)) return 'BUREAU';
  if (n.includes('secours') || n.includes('caya') || n.includes('caisse') || n.includes('reserve')) {
    return 'RESCUE_FUND';
  }
  if (n.includes('fete') || n.includes('autres') || n.includes('divers')) return 'AUTRES_FETE';
  return null;
}

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export interface LoanTimelineInput {
  disbursements: Record<number, number>;
  interests: Record<number, number>;
  repayments: Record<number, number>;
}

export interface LoanTimelineMonth {
  month: number;
  balanceAtMonthStart: number;
  interestAccrued: number;
  balanceWithInterest: number;
  repaymentReceived: number;
  balanceAtMonthEnd: number;
  interestPart: number;
  principalPart: number;
}

/**
 * Reconstitue l'évolution mois par mois d'un prêt agrégé à partir des
 * décaissements, intérêts et remboursements connus.
 *
 * Convention (données de synthèse importées, donc approximation raisonnée) :
 *  - le décaissement du mois augmente le capital en début de mois,
 *  - l'intérêt s'accumule sur ce capital,
 *  - le remboursement éteint d'abord l'intérêt du mois, puis le principal.
 *
 * Remplace les anciens placeholders à 0 (balanceAtMonthStart, balanceAfter…).
 */
export function reconstructLoanTimeline(input: LoanTimelineInput): LoanTimelineMonth[] {
  const months = new Set<number>();
  for (const m of Object.keys(input.disbursements)) months.add(Number(m));
  for (const m of Object.keys(input.interests)) months.add(Number(m));
  for (const m of Object.keys(input.repayments)) months.add(Number(m));

  const ordered = Array.from(months)
    .filter((m) => Number.isFinite(m) && m >= 1 && m <= 12)
    .sort((a, b) => a - b);

  const timeline: LoanTimelineMonth[] = [];
  let balance = 0;

  for (const month of ordered) {
    const disbursed = n(input.disbursements[month]);
    const interest = n(input.interests[month]);
    const repayment = n(input.repayments[month]);

    balance += disbursed;
    const balanceAtMonthStart = balance;
    const balanceWithInterest = balanceAtMonthStart + interest;

    const interestPart = Math.min(interest, repayment);
    const principalPart = Math.max(0, repayment - interestPart);

    balance = Math.max(0, balanceWithInterest - repayment);

    timeline.push({
      month,
      balanceAtMonthStart,
      interestAccrued: interest,
      balanceWithInterest,
      repaymentReceived: repayment,
      balanceAtMonthEnd: balance,
      interestPart,
      principalPart,
    });
  }

  return timeline;
}

/* ── Import "exercice en cours" : dernier mois saisi & statut des sessions ── */

export interface MonthlyDataSource {
  savings?: { deposits?: Record<number, number>; interests?: Record<number, number> }[];
  loans?: { disbursements?: Record<number, number> }[];
  repayments?: { repayments?: Record<number, number> }[];
  interests?: { interests?: Record<number, number> }[];
  rescueFund?: { contributions?: Record<number, number> }[];
  sessions?: { sessionNumber: number; entries?: unknown[] }[];
}

/**
 * Dernier mois (1-12) effectivement saisi, tous flux confondus
 * (épargne, prêts, remboursements, intérêts, secours, séances).
 * Renvoie 0 si aucune donnée → un exercice "en cours" démarrera au mois 1.
 */
export function computeLastRecordedMonth(d: MonthlyDataSource): number {
  let max = 0;
  const scan = (rec?: Record<number, number>): void => {
    if (!rec) return;
    for (const [m, v] of Object.entries(rec)) {
      const mm = Number(m);
      if (Number.isFinite(mm) && mm >= 1 && mm <= 12 && n(v) > 0) max = Math.max(max, mm);
    }
  };
  for (const s of d.savings ?? []) {
    scan(s.deposits);
    scan(s.interests);
  }
  for (const l of d.loans ?? []) scan(l.disbursements);
  for (const r of d.repayments ?? []) scan(r.repayments);
  for (const i of d.interests ?? []) scan(i.interests);
  for (const rf of d.rescueFund ?? []) scan(rf.contributions);
  for (const sess of d.sessions ?? []) {
    if ((sess.entries?.length ?? 0) > 0 && sess.sessionNumber >= 1 && sess.sessionNumber <= 12) {
      max = Math.max(max, sess.sessionNumber);
    }
  }
  return max;
}

export type OngoingSessionStatus = 'CLOSED' | 'OPEN' | 'DRAFT';

/**
 * Statut d'une session pour un import "en cours" :
 *  - mois ≤ dernier saisi  → CLOSED (historique figé)
 *  - mois juste après      → OPEN   (reprise de la saisie ; un seul OPEN autorisé)
 *  - mois suivants         → DRAFT  (à venir)
 */
export function sessionStatusForOngoing(month: number, lastRecorded: number): OngoingSessionStatus {
  if (month <= lastRecorded) return 'CLOSED';
  if (month === lastRecorded + 1 && lastRecorded < 12) return 'OPEN';
  return 'DRAFT';
}
