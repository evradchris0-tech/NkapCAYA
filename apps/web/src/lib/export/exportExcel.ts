import ExcelJS from 'exceljs';
import type {
  SavingsLedger,
  MonthlySession,
  BeneficiarySchedule,
  FiscalYearExportData,
  ExportMembership,
  ExportSession,
  ExportSavingsLedger,
  ExportLoanAccount,
} from '@/types/api.types';

// ── Styling helpers ──────────────────────────────────────────────────────────

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E293B' }, // slate-800
};
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' }, // slate-100
};
const TOTAL_FONT: Partial<ExcelJS.Font> = { bold: true, size: 11 };
const NUM_FMT = '#,##0';
const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER_THIN;
  });
  row.height = 28;
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = TOTAL_FILL;
    cell.font = TOTAL_FONT;
    cell.border = BORDER_THIN;
  });
}

function styleDataRows(ws: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber > 2 && typeof cell.value === 'number') {
        cell.numFmt = NUM_FMT;
      }
    });
  }
}

function autoWidth(ws: ExcelJS.Worksheet, minWidth = 12) {
  ws.columns.forEach((col) => {
    let max = minWidth;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length + 2;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 30);
  });
}

async function saveWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Exports existants (migrés de xlsx vers exceljs) ──────────────────────────

export async function exportSavingsToExcel(ledgers: SavingsLedger[], fyLabel: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Épargnes');

  ws.addRow(['Membership ID', 'Solde (XAF)', 'Capital versé (XAF)', 'Intérêts reçus (XAF)']);
  styleHeader(ws.getRow(1));

  ledgers.forEach((l) => {
    ws.addRow([l.membershipId, parseFloat(l.balance), parseFloat(l.principalBalance), parseFloat(l.totalInterestReceived)]);
  });

  styleDataRows(ws, 2, ws.rowCount);
  autoWidth(ws);
  await saveWorkbook(wb, `epargnes_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}

export async function exportSessionsToExcel(sessions: MonthlySession[], fyLabel: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sessions');

  ws.addRow([
    'N° Session', 'Date réunion', 'Statut', 'Cotisation', 'Pot', 'Inscription',
    'Secours', 'Rbt Principal', 'Rbt Intérêts', 'Épargne', 'Projet', 'Autres',
  ]);
  styleHeader(ws.getRow(1));

  sessions.forEach((s) => {
    ws.addRow([
      s.sessionNumber,
      new Date(s.meetingDate).toLocaleDateString('fr-FR'),
      s.status,
      parseFloat(s.totalCotisation || '0'),
      parseFloat(s.totalPot || '0'),
      parseFloat(s.totalInscription || '0'),
      parseFloat(s.totalSecours || '0'),
      parseFloat(s.totalRbtPrincipal || '0'),
      parseFloat(s.totalRbtInterest || '0'),
      parseFloat(s.totalEpargne || '0'),
      parseFloat(s.totalProjet || '0'),
      parseFloat(s.totalAutres || '0'),
    ]);
  });

  styleDataRows(ws, 2, ws.rowCount);
  autoWidth(ws);
  await saveWorkbook(wb, `sessions_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}

export async function exportBeneficiariesToExcel(schedule: BeneficiarySchedule, fyLabel: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Bénéficiaires');

  ws.addRow(['Mois', 'Slot', 'Bénéficiaire', 'Code', 'Montant (XAF)', 'Statut']);
  styleHeader(ws.getRow(1));

  (schedule.slots ?? []).forEach((slot) => {
    ws.addRow([
      `M${slot.month}`,
      `#${slot.slotIndex}`,
      slot.membership?.profile
        ? `${slot.membership.profile.lastName} ${slot.membership.profile.firstName}`
        : '—',
      slot.membership?.profile?.memberCode ?? '—',
      parseFloat(slot.amountDelivered),
      slot.status,
    ]);
  });

  styleDataRows(ws, 2, ws.rowCount);
  autoWidth(ws);
  await saveWorkbook(wb, `beneficiaires_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}

// ── Export complet CAYABASE ──────────────────────────────────────────────────

/** Noms de mois courts pour les en-têtes, en partant du mois de début de l'exercice */
function getMonthLabels(startDate: string): string[] {
  const d = new Date(startDate);
  const ALL = ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const start = d.getMonth(); // 0-based
  return Array.from({ length: 12 }, (_, i) => ALL[(start + i) % 12]);
}

/** Nom court mois.AA depuis une date ISO */
function shortMonthYear(iso: string): string {
  const d = new Date(iso);
  const months = ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  return `${months[d.getMonth()]}.${String(d.getFullYear()).slice(-2)}`;
}

/** Map membershipId → "NOM Prénom" */
function buildNameMap(memberships: ExportMembership[]): Map<string, string> {
  const map = new Map<string, string>();
  memberships.forEach((m) => {
    if (m.profile) {
      map.set(m.id, `${m.profile.lastName} ${m.profile.firstName}`);
    }
  });
  return map;
}

/** Map sessionId → sessionNumber */
function buildSessionMap(sessions: ExportSession[]): Map<string, number> {
  const map = new Map<string, number>();
  sessions.forEach((s) => map.set(s.id, s.sessionNumber));
  return map;
}

/** Parse un Decimal string en nombre */
function num(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : parseFloat(v) || 0;
}

// ── Feuille 1 : ep+int (Épargne + Intérêts) ─────────────────────────────────

function buildSheetEpargneInterets(
  wb: ExcelJS.Workbook,
  data: FiscalYearExportData,
  monthLabels: string[],
  nameMap: Map<string, string>,
) {
  const ws = wb.addWorksheet('ep+int');

  // Headers : N | NOM | EP M1 | EP+INT M1 | EP M2 | CUMUL2 | EP+INT2 | ... | EP TOTALE | INTERETS | NAP || N | NOM | EPARGNE | INTERET | TOTAL
  const headers: string[] = ['N°', 'NOMS ET PRENOMS'];
  for (let i = 0; i < 12; i++) {
    if (i === 0) {
      headers.push(`EP ${monthLabels[i].toUpperCase()}`);
      headers.push(`EP+INT ${monthLabels[i].toUpperCase()}`);
    } else {
      headers.push(`EP ${monthLabels[i].toUpperCase()}`);
      headers.push(`CUMUL${i}`);
      headers.push(`EP+INT${i}`);
    }
  }
  headers.push('EP TOTALE', 'INTERETS', 'N A P');
  // Separator + recap block
  headers.push('', 'N°', 'NOM', 'EPARGNE', 'INTERET', 'TOTAL');

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  // Build per-member savings by month
  const memberIds = data.memberships.map((m) => m.id);

  memberIds.forEach((mid, idx) => {
    const name = nameMap.get(mid) ?? mid.slice(-8);
    const ledger = data.savingsLedgers.find((l) => l.membershipId === mid);
    const entries = ledger?.entries ?? [];

    // Group by month: { month → { deposits, interests } }
    const byMonth: Record<number, { deposit: number; interest: number }> = {};
    entries.forEach((e) => {
      if (!byMonth[e.month]) byMonth[e.month] = { deposit: 0, interest: 0 };
      if (e.type === 'DEPOSIT') byMonth[e.month].deposit += num(e.amount);
      else byMonth[e.month].interest += num(e.amount);
    });

    const row: (string | number)[] = [idx + 1, name];
    let cumulDeposit = 0;
    let cumulInterest = 0;
    let totalDeposit = 0;
    let totalInterest = 0;

    for (let m = 1; m <= 12; m++) {
      const dep = byMonth[m]?.deposit ?? 0;
      const int = byMonth[m]?.interest ?? 0;
      cumulDeposit += dep;
      cumulInterest += int;
      totalDeposit += dep;
      totalInterest += int;

      if (m === 1) {
        row.push(dep, cumulDeposit + cumulInterest);
      } else {
        row.push(dep, cumulDeposit, cumulDeposit + cumulInterest);
      }
    }

    row.push(totalDeposit, totalInterest, totalDeposit + totalInterest);
    // Recap block
    row.push('', idx + 1, name, num(ledger?.principalBalance), num(ledger?.totalInterestReceived), num(ledger?.balance));

    ws.addRow(row);
  });

  // Total row
  const totalRow: (string | number)[] = ['', 'TOTAUX'];
  // Sum columns from row 2 onward
  const dataRows = ws.rowCount;
  const numCols = headers.length;
  for (let c = 3; c <= numCols; c++) {
    let sum = 0;
    for (let r = 2; r <= dataRows; r++) {
      const v = ws.getRow(r).getCell(c).value;
      if (typeof v === 'number') sum += v;
    }
    totalRow.push(sum);
  }
  const tRow = ws.addRow(totalRow);
  styleTotalRow(tRow);

  styleDataRows(ws, 2, dataRows);
  autoWidth(ws, 10);
}

// ── Feuille 2 : prets (Prêts décaissés) ─────────────────────────────────────

function buildSheetPrets(
  wb: ExcelJS.Workbook,
  data: FiscalYearExportData,
  monthLabels: string[],
  nameMap: Map<string, string>,
  sessionMap: Map<string, number>,
) {
  const ws = wb.addWorksheet('prets');

  const headers = ['Noms et prénoms'];
  monthLabels.forEach((m) => headers.push(m.toUpperCase()));
  headers.push('TOTAL', '', 'PRETS', 'INTER', 'REMB', 'RESTE');

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  const memberIds = data.memberships.map((m) => m.id);

  memberIds.forEach((mid) => {
    const name = nameMap.get(mid) ?? mid.slice(-8);
    const memberLoans = data.loans.filter((l) => l.membershipId === mid);
    const row: (string | number)[] = [name];

    // Monthly disbursements
    const disbursedByMonth: Record<number, number> = {};
    memberLoans.forEach((loan) => {
      if (loan.disbursedAt) {
        const sessNum = sessionMap.get(loan.fiscalYearId) ?? 0;
        // Find session for disbursement date
        for (const s of data.sessions) {
          if (loan.disbursedAt && new Date(loan.disbursedAt) <= new Date(s.meetingDate)) {
            disbursedByMonth[s.sessionNumber] = (disbursedByMonth[s.sessionNumber] ?? 0) + num(loan.principalAmount);
            break;
          }
        }
        // Fallback: use accruals month if no session match
        if (Object.keys(disbursedByMonth).length === 0 && loan.monthlyAccruals.length > 0) {
          const firstMonth = loan.monthlyAccruals[0].month;
          disbursedByMonth[firstMonth] = (disbursedByMonth[firstMonth] ?? 0) + num(loan.principalAmount);
        }
      }
    });

    let totalDisbursed = 0;
    for (let m = 1; m <= 12; m++) {
      const v = disbursedByMonth[m] ?? 0;
      totalDisbursed += v;
      row.push(v || '');
    }
    row.push(totalDisbursed || '');

    // Recap
    const totalPrets = memberLoans.reduce((s, l) => s + num(l.principalAmount), 0);
    const totalInter = memberLoans.reduce((s, l) => s + num(l.totalInterestAccrued), 0);
    const totalRemb = memberLoans.reduce((s, l) => s + num(l.totalRepaid), 0);
    const reste = memberLoans.reduce((s, l) => s + num(l.outstandingBalance), 0);

    row.push('', totalPrets || '', totalInter || '', totalRemb || '', reste || '');
    ws.addRow(row);
  });

  styleDataRows(ws, 2, ws.rowCount);
  autoWidth(ws);
}

// ── Feuille 3 : Rem (Remboursements) ────────────────────────────────────────

function buildSheetRemboursements(
  wb: ExcelJS.Workbook,
  data: FiscalYearExportData,
  monthLabels: string[],
  nameMap: Map<string, string>,
  sessionMap: Map<string, number>,
) {
  const ws = wb.addWorksheet('Rem');

  const headers = ['Noms et prénoms'];
  monthLabels.forEach((m) => headers.push(m.toUpperCase()));
  headers.push('TOTAL REM');

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  const memberIds = data.memberships.map((m) => m.id);

  memberIds.forEach((mid) => {
    const name = nameMap.get(mid) ?? mid.slice(-8);
    const memberLoans = data.loans.filter((l) => l.membershipId === mid);
    const row: (string | number)[] = [name];

    // Monthly repayments
    const repByMonth: Record<number, number> = {};
    memberLoans.forEach((loan) => {
      loan.repayments.forEach((rep) => {
        const sessNum = sessionMap.get(rep.sessionId);
        if (sessNum) {
          repByMonth[sessNum] = (repByMonth[sessNum] ?? 0) + num(rep.amount);
        }
      });
    });

    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const v = repByMonth[m] ?? 0;
      total += v;
      row.push(v || '');
    }
    row.push(total || '');
    ws.addRow(row);
  });

  styleDataRows(ws, 2, ws.rowCount);
  autoWidth(ws);
}

// ── Feuille 4 : intérêts (Intérêts sur prêts) ──────────────────────────────

function buildSheetInteretsPrets(
  wb: ExcelJS.Workbook,
  data: FiscalYearExportData,
  monthLabels: string[],
  nameMap: Map<string, string>,
) {
  const ws = wb.addWorksheet('intérêts');

  const headers = ['Noms et prénoms'];
  monthLabels.forEach((m) => headers.push(m.toUpperCase()));
  headers.push('TOTAL');

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  const memberIds = data.memberships.map((m) => m.id);

  memberIds.forEach((mid) => {
    const name = nameMap.get(mid) ?? mid.slice(-8);
    const memberLoans = data.loans.filter((l) => l.membershipId === mid);
    const row: (string | number)[] = [name];

    // Monthly interest accrued
    const intByMonth: Record<number, number> = {};
    memberLoans.forEach((loan) => {
      loan.monthlyAccruals.forEach((a) => {
        intByMonth[a.month] = (intByMonth[a.month] ?? 0) + num(a.interestAccrued);
      });
    });

    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const v = intByMonth[m] ?? 0;
      total += v;
      row.push(v || '');
    }
    row.push(total || '');
    ws.addRow(row);
  });

  // Total row
  const totalRow: (string | number)[] = ['TOTAL'];
  for (let c = 2; c <= 14; c++) {
    let sum = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
      const v = ws.getRow(r).getCell(c).value;
      if (typeof v === 'number') sum += v;
    }
    totalRow.push(sum || '');
  }
  const tRow = ws.addRow(totalRow);
  styleTotalRow(tRow);

  styleDataRows(ws, 2, ws.rowCount - 1);
  autoWidth(ws);
}

// ── Feuille 5 : insc+sec (Inscriptions + Secours) ──────────────────────────

function buildSheetInscSecours(
  wb: ExcelJS.Workbook,
  data: FiscalYearExportData,
  monthLabels: string[],
  nameMap: Map<string, string>,
) {
  const ws = wb.addWorksheet('insc+sec');

  const headers = ['NOMS ET PRENOMS', 'inscriptions'];
  monthLabels.forEach((m) => headers.push(`SEC ${m.toUpperCase()}`));
  headers.push('TOTAL');

  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  const memberIds = data.memberships.map((m) => m.id);

  memberIds.forEach((mid) => {
    const name = nameMap.get(mid) ?? mid.slice(-8);
    const row: (string | number)[] = [name];

    // Inscription amount (from session entries of type INSCRIPTION)
    let inscTotal = 0;
    const secBySession: Record<number, number> = {};

    data.sessions.forEach((sess) => {
      sess.entries.forEach((entry) => {
        if (entry.membershipId !== mid) return;
        if (entry.type === 'INSCRIPTION') inscTotal += num(entry.amount);
        if (entry.type === 'SECOURS') {
          secBySession[sess.sessionNumber] = (secBySession[sess.sessionNumber] ?? 0) + num(entry.amount);
        }
      });
    });

    row.push(inscTotal || '');

    let totalSec = 0;
    for (let m = 1; m <= 12; m++) {
      const v = secBySession[m] ?? 0;
      totalSec += v;
      row.push(v || '');
    }
    row.push(totalSec || '');
    ws.addRow(row);
  });

  // Total row
  const totalRow: (string | number)[] = ['total'];
  for (let c = 2; c <= ws.getRow(1).cellCount; c++) {
    let sum = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
      const v = ws.getRow(r).getCell(c).value;
      if (typeof v === 'number') sum += v;
    }
    totalRow.push(sum || '');
  }
  const tRow = ws.addRow(totalRow);
  styleTotalRow(tRow);

  styleDataRows(ws, 2, ws.rowCount - 1);
  autoWidth(ws);
}

// ── Feuilles 6-17 : Détail par session ──────────────────────────────────────

const TX_COLUMNS: { type: string; label: string; types: string[] }[] = [
  { type: 'INSC', label: 'INSC', types: ['INSCRIPTION'] },
  { type: 'SEC', label: 'SECOURS', types: ['SECOURS'] },
  { type: 'TON', label: 'TONTINE', types: ['COTISATION'] },
  { type: 'POT', label: 'POT', types: ['POT'] },
  { type: 'REM', label: 'REM_PRET', types: ['RBT_PRINCIPAL', 'RBT_INTEREST'] },
  { type: 'EP', label: 'EPARGNE', types: ['EPARGNE'] },
  { type: 'PRET', label: 'PRÊT', types: ['PROJET'] }, // PROJET mapped to PRÊT column? Actually PRET in CAYABASE means new loan received, not project
  { type: 'PROJ', label: 'PROJET', types: ['PROJET'] },
  { type: 'AUT', label: 'AUTRES', types: ['AUTRES'] },
];

function buildSheetSession(
  wb: ExcelJS.Workbook,
  session: ExportSession,
  data: FiscalYearExportData,
  nameMap: Map<string, string>,
) {
  const sheetName = shortMonthYear(session.meetingDate);
  const ws = wb.addWorksheet(sheetName);

  const headers = ['N', 'NOMS ET PRENOMS', 'INSC', 'SECOURS', 'TONTINE', 'POT', 'REM_PRET', 'EPARGNE', 'PRÊT', 'PROJET', 'AUTRES', 'TOTAL'];
  ws.addRow(headers);
  styleHeader(ws.getRow(1));

  // Group entries by member
  const entriesByMember = new Map<string, Map<string, number>>();
  session.entries.forEach((entry) => {
    if (!entriesByMember.has(entry.membershipId)) {
      entriesByMember.set(entry.membershipId, new Map());
    }
    const memberEntries = entriesByMember.get(entry.membershipId)!;
    const current = memberEntries.get(entry.type) ?? 0;
    memberEntries.set(entry.type, current + num(entry.amount));
  });

  // Find new loans disbursed this session (for PRÊT column)
  const newLoansThisSession = new Map<string, number>();
  data.loans.forEach((loan) => {
    if (loan.disbursedAt) {
      // Check if disbursed around this session's meeting date
      const loanDate = new Date(loan.disbursedAt);
      const meetDate = new Date(session.meetingDate);
      // Match by month/year
      if (loanDate.getMonth() === meetDate.getMonth() && loanDate.getFullYear() === meetDate.getFullYear()) {
        const current = newLoansThisSession.get(loan.membershipId) ?? 0;
        newLoansThisSession.set(loan.membershipId, current + num(loan.principalAmount));
      }
    }
  });

  const memberIds = data.memberships.map((m) => m.id);
  let rowIdx = 0;

  memberIds.forEach((mid) => {
    rowIdx++;
    const name = nameMap.get(mid) ?? mid.slice(-8);
    const me = entriesByMember.get(mid);

    const insc = me?.get('INSCRIPTION') ?? 0;
    const sec = me?.get('SECOURS') ?? 0;
    const cot = me?.get('COTISATION') ?? 0;
    const pot = me?.get('POT') ?? 0;
    const rbtP = me?.get('RBT_PRINCIPAL') ?? 0;
    const rbtI = me?.get('RBT_INTEREST') ?? 0;
    const remPret = rbtP + rbtI;
    const ep = me?.get('EPARGNE') ?? 0;
    const pret = newLoansThisSession.get(mid) ?? 0;
    const projet = me?.get('PROJET') ?? 0;
    const autres = me?.get('AUTRES') ?? 0;
    const total = insc + sec + cot + pot + remPret + ep + projet + autres;

    ws.addRow([
      rowIdx, name,
      insc || '', sec || '', cot || '', pot || '', remPret || '',
      ep || '', pret || '', projet || '', autres || '',
      total || '',
    ]);
  });

  // Total row
  const totalRow: (string | number)[] = ['', 'TOTAUX'];
  for (let c = 3; c <= 12; c++) {
    let sum = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
      const v = ws.getRow(r).getCell(c).value;
      if (typeof v === 'number') sum += v;
    }
    totalRow.push(sum || '');
  }
  const tRow = ws.addRow(totalRow);
  styleTotalRow(tRow);

  styleDataRows(ws, 2, ws.rowCount - 1);
  autoWidth(ws);
}

// ── Fonction principale ─────────────────────────────────────────────────────

export async function exportFiscalYearToExcel(data: FiscalYearExportData, fyLabel: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CAYA - Club des Amis de Yaoundé';
  wb.created = new Date();

  const monthLabels = getMonthLabels(data.fiscalYear.startDate);
  const nameMap = buildNameMap(data.memberships);
  const sessionMap = buildSessionMap(data.sessions);

  // 5 feuilles récapitulatives
  buildSheetEpargneInterets(wb, data, monthLabels, nameMap);
  buildSheetPrets(wb, data, monthLabels, nameMap, sessionMap);
  buildSheetRemboursements(wb, data, monthLabels, nameMap, sessionMap);
  buildSheetInteretsPrets(wb, data, monthLabels, nameMap);
  buildSheetInscSecours(wb, data, monthLabels, nameMap);

  // 12 feuilles de session (une par session non-DRAFT)
  data.sessions
    .filter((s) => s.status !== 'DRAFT')
    .forEach((session) => {
      buildSheetSession(wb, session, data, nameMap);
    });

  await saveWorkbook(wb, `CAYABASE_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}
