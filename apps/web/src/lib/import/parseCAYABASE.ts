/**
 * parseCAYABASE.ts — Parse a CAYABASE Excel file into a structured ImportFiscalYearDto
 *
 * Actual sheet names observed in CAYABASE.xlsx:
 * - "ep+int"        → savings deposits + interest per member per month + recap
 * - "prets25"       → loan disbursements (year suffix varies)
 * - "Rem25"         → loan repayments (year suffix varies)
 * - "intérêts"      → interest accrued on loans
 * - "insc+sec"      → inscription + secours contributions
 * - "Oct.25 (2)"    → session sheet (may have " (N)" suffix)
 *
 * Notes:
 * - Summary sheets have names in column 1 (no N° column)
 * - Session sheets have N° in column 1, names in column 2
 * - Month headers can be truncated: OCTO, AVRI, JUILL, etc.
 * - Formulas may not have cached results → read raw values
 */

import ExcelJS from 'exceljs';

/* ── Types matching the backend DTO ── */

export interface ImportSessionEntryRow {
  memberName: string;
  inscription: number;
  secours: number;
  tontine: number;
  pot: number;
  remPret: number;
  epargne: number;
  pret: number;
  projet: number;
  autres: number;
}

export interface ImportSessionData {
  sessionNumber: number;
  entries: ImportSessionEntryRow[];
}

export interface ImportSavingsRow {
  memberName: string;
  deposits: Record<number, number>;
  interests: Record<number, number>;
  totalDeposit: number;
  totalInterest: number;
}

export interface ImportLoanRow {
  memberName: string;
  disbursements: Record<number, number>;
  totalInterest: number;
  totalRepaid: number;
  outstanding: number;
}

export interface ImportRepaymentRow {
  memberName: string;
  repayments: Record<number, number>;
}

export interface ImportInterestRow {
  memberName: string;
  interests: Record<number, number>;
}

export interface ImportRescueFundRow {
  memberName: string;
  inscription: number;
  contributions: Record<number, number>;
}

/** Type de poste comptable spécial (non-membre) du modèle CAYABASE */
export type SpecialAccountKind = 'RESCUE_FUND' | 'BUREAU' | 'AUTRES_FETE';

/**
 * Ligne "spéciale" de la feuille ep+int : un poste comptable, PAS un membre.
 * Modèle CAYABASE : "SECOURS / CAYA", "BUREAU", "AUTRES / FETE".
 */
export interface ImportSpecialAccountRow {
  label: string; // libellé d'origine, ex. "SECOURS / CAYA"
  kind: SpecialAccountKind;
  deposits: Record<number, number>;
  totalDeposit: number;
  totalInterest: number;
}

export interface ImportFiscalYearDto {
  label: string;
  startDate: string;
  endDate: string;
  members: string[];
  savings: ImportSavingsRow[];
  loans: ImportLoanRow[];
  repayments: ImportRepaymentRow[];
  interests: ImportInterestRow[];
  rescueFund: ImportRescueFundRow[];
  sessions: ImportSessionData[];
  specialAccounts: ImportSpecialAccountRow[];
}

export interface ParseResult {
  data: ImportFiscalYearDto;
  warnings: string[];
  criticalErrors: string[];
}

/* ── Helpers ── */

/** Normalize & strip accents for comparison */
function normStr(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Known summary sheet identifiers (after normalization + stripping trailing digits) */
const KNOWN_SHEET_KEYS = ['ep+int', 'prets', 'rem', 'interets', 'insc+sec'];

/** Classify a sheet name: returns the known key or null */
function classifySheet(name: string): string | null {
  const n = normStr(name)
    .replace(/\s*\(\d+\)\s*$/, '') // strip " (2)" suffix
    .replace(/\d+$/, '');          // strip trailing digits like "25"
  for (const key of KNOWN_SHEET_KEYS) {
    if (n === key) return key;
  }
  return null;
}

/**
 * Month name → absolute month (1-12).
 * Handles truncated names: OCTO→10, AVRI→4, JUILL→7, etc.
 */
const MONTH_PREFIXES: Array<[string, number]> = [
  ['janv', 1], ['jan', 1],
  ['fev', 2], ['feb', 2],
  ['mars', 3], ['mar', 3],
  ['avri', 4], ['avr', 4],
  ['mai', 5], ['may', 5],
  ['juin', 6], ['jun', 6],
  ['juill', 7], ['juil', 7], ['jul', 7],
  ['aout', 8], ['aug', 8],
  ['sept', 9], ['sep', 9],
  ['octo', 10], ['oct', 10],
  ['nov', 11],
  ['dec', 12],
];

function parseMonthName(raw: string): number | null {
  const s = normStr(raw);
  for (const [prefix, month] of MONTH_PREFIXES) {
    if (s === prefix || s.startsWith(prefix)) return month;
  }
  return null;
}

/** Parse "Oct.25" or "Oct.25 (2)" → { month: 10, year: 2025 } */
function parseSessionSheetName(name: string): { month: number; year: number } | null {
  const cleaned = name.replace(/\s*\(\d+\)\s*$/, '').trim(); // strip " (2)"
  const match = cleaned.match(/^([A-Za-zÀ-ÿ]+)\.(\d{2})$/);
  if (!match) return null;
  const month = parseMonthName(match[1]);
  if (!month) return null;
  return { month, year: 2000 + parseInt(match[2], 10) };
}

function num(v: ExcelJS.CellValue): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'object' && 'result' in v) return num((v as { result: ExcelJS.CellValue }).result);
  return 0;
}

function str(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object' && 'richText' in v) {
    return (v as { richText: Array<{ text: string }> }).richText.map((r) => r.text).join('');
  }
  return String(v).trim();
}

/** Is this a member-name cell (not a header/total row)? */
function isNameCell(val: ExcelJS.CellValue): boolean {
  const s = str(val);
  return s.length > 2 && !/^(n°?|noms?|total|sous-total|recap|colonne)/i.test(s) && !/^\d+$/.test(s);
}

/**
 * Classe une ligne de la feuille ep+int comme poste comptable spécial (non-membre).
 * Modèle CAYABASE : "SECOURS / CAYA", "BUREAU", "AUTRES / FETE".
 * Retourne le type de pool correspondant, ou null si c'est un vrai membre.
 */
export function classifySpecialAccount(name: string): SpecialAccountKind | null {
  const n = normStr(name); // minuscule, sans accents, trim
  if (/(^|[^a-z])bureau([^a-z]|$)/.test(n)) return 'BUREAU';
  if (n.includes('secours') || n.includes('caya') || n.includes('caisse') || n.includes('reserve')) {
    return 'RESCUE_FUND';
  }
  if (n.includes('fete') || n.includes('autres') || n.includes('divers')) return 'AUTRES_FETE';
  return null;
}

/**
 * Marqueur de fin de la liste des membres dans une feuille de session :
 * au-delà commence le cashbook / récapitulatif (RECETTES, DEPENSES, SOLDE…).
 */
function isSessionTerminator(name: string): boolean {
  const n = normStr(name);
  return /^(total|totaux|libelles?|recettes?|depenses?|solde|beneficiaires?|recapitulatif|recap)\b/.test(n);
}

/** Libellés de poste du cashbook (RECETTES/DEPENSES) — ce ne sont pas des membres. */
const CASHBOOK_LABELS = new Set([
  'inscrip', 'inscription', 'inscriptions', 'secours', 'tontine', 'cotisation', 'pot',
  'remb & int', 'remb et int', 'rem & int', 'epargne', 'pret', 'projet', 'pret projet',
  'autres', 'recettes', 'depenses', 'solde', 'solde en caisse', 'nap', 'n a p',
  'eparg_int', 'eparg int', 'dette_int', 'dette int', 's_tot', 's tot', 'retenus',
  'entree', 'sortie', 'sec',
]);

function isCashbookLabel(name: string): boolean {
  return CASHBOOK_LABELS.has(normStr(name));
}

/** Distance de Levenshtein (utilisée pour repérer les noms quasi-dupliqués). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Find the column that holds member names in a worksheet.
 * Returns 1 if col1 has names, 2 if col2 has names.
 */
function findNameColumn(ws: ExcelJS.Worksheet): number {
  let namesInCol1 = 0;
  let namesInCol2 = 0;
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= 1 || rowNumber > 5) return;
    if (isNameCell(row.getCell(1).value)) namesInCol1++;
    if (isNameCell(row.getCell(2).value)) namesInCol2++;
  });
  return namesInCol2 >= namesInCol1 ? 2 : 1;
}

/**
 * Detect month columns in a header row.
 * Scans header text for month names (EP AOUT, SEPT, SEC OCT, etc.)
 * Returns: colIndex → session month (1-12)
 */
function detectMonthColumns(
  headerRow: ExcelJS.Row,
  startMonth: number,
  opts?: { prefix?: string; skipContaining?: string[] },
): Map<number, number> {
  const map = new Map<number, number>();
  const skip = (opts?.skipContaining ?? []).map((s) => s.toLowerCase());

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const raw = normStr(str(cell.value));
    // Skip unwanted headers
    if (raw.includes('total') || raw.includes('cumul') || raw.includes('n a p')) return;
    for (const s of skip) { if (raw.includes(s)) return; }

    // Extract the month part
    let monthPart = raw;
    if (opts?.prefix) {
      if (!raw.startsWith(opts.prefix)) return;
      monthPart = raw.slice(opts.prefix.length).trim();
    }

    const month = parseMonthName(monthPart);
    if (month == null) return;

    let sessionMonth = month - startMonth + 1;
    if (sessionMonth <= 0) sessionMonth += 12;
    if (sessionMonth >= 1 && sessionMonth <= 12 && !hasSessionMonth(map, sessionMonth)) {
      map.set(colNumber, sessionMonth);
    }
  });

  return map;
}

function hasSessionMonth(map: Map<number, number>, sm: number): boolean {
  for (const v of map.values()) { if (v === sm) return true; }
  return false;
}

/* ── Main parser ── */

export async function parseCAYABASE(buffer: ArrayBuffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const warnings: string[] = [];
  const criticalErrors: string[] = [];

  // 1. Classify sheets
  const sessionSheets: Array<{ sheetName: string; month: number; year: number; ws: ExcelJS.Worksheet }> = [];
  const summarySheets = new Map<string, ExcelJS.Worksheet>();

  for (const ws of wb.worksheets) {
    const key = classifySheet(ws.name);
    if (key) {
      summarySheets.set(key, ws);
    } else {
      const parsed = parseSessionSheetName(ws.name);
      if (parsed) {
        sessionSheets.push({ sheetName: ws.name, ...parsed, ws });
      } else {
        warnings.push(`Feuille ignorée : "${ws.name}"`);
      }
    }
  }

  // 2. Infer start date — from session sheets if available, else from ep+int headers
  let startMonth: number;
  let startYear: number;

  if (sessionSheets.length > 0) {
    sessionSheets.sort((a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
    // The first session sheet might not be month 1 — infer from summary sheet headers
    startMonth = inferStartMonthFromHeaders(summarySheets.get('ep+int')) ?? sessionSheets[0].month;
    startYear = sessionSheets[0].year;
    // If start month is after session month in the same year, start year is one year earlier
    if (startMonth > sessionSheets[0].month) {
      // e.g. start=Aug(8), first session=Oct(10) → same year, but if start=Aug(8) and session=Jan(1) → year-1
      // Actually, if the fiscal year starts in August and the first session sheet is Oct of same year, fine.
    }
  } else {
    // No session sheets — infer entirely from summary headers
    const inferred = inferStartMonthFromHeaders(summarySheets.get('ep+int'));
    if (!inferred) {
      throw new Error('Impossible de déterminer les dates : aucune feuille de session ni en-tête de mois détecté.');
    }
    startMonth = inferred;
    // Guess year from sheet names with digits
    startYear = guessYearFromSheetNames(wb) ?? new Date().getFullYear();
    warnings.push('Aucune feuille de session trouvée — dates inférées des en-têtes.');
  }

  const startDate = new Date(startYear, startMonth - 1, 1);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setDate(endDate.getDate() - 1);

  const label = `${startYear}-${startYear + 1}`;

  // 3. Collect member names — prefer ep+int (all members), fallback to session sheets
  const memberSet = new Map<string, string>(); // normalized → original

  const primarySheet = summarySheets.get('ep+int') || summarySheets.get('insc+sec');
  if (primarySheet) {
    const nameCol = findNameColumn(primarySheet);
    primarySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (nameVal && isNameCell(row.getCell(nameCol).value)) {
        if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre
        const norm = nameVal.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (!memberSet.has(norm)) memberSet.set(norm, nameVal);
      }
    });
  }

  // Also collect from session sheets (stop at the cashbook/r\u00e9cap section)
  for (const ss of sessionSheets) {
    const nameCol = findNameColumn(ss.ws);
    let ended = false;
    ss.ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1 || ended) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (isSessionTerminator(nameVal)) { ended = true; return; }
      if (nameVal && isNameCell(row.getCell(nameCol).value)) {
        if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre
        if (isCashbookLabel(nameVal)) return; // libell\u00e9 de cashbook, pas un membre
        const norm = nameVal.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (!memberSet.has(norm)) memberSet.set(norm, nameVal);
      }
    });
  }

  const members = Array.from(memberSet.values());
  if (members.length === 0) {
    criticalErrors.push('Aucun membre détecté dans le fichier.');
  }

  // Vérification de la qualité des noms
  let suspectNamesCount = 0;
  for (const m of members) {
    if (/\d/.test(m)) suspectNamesCount++;
  }
  if (suspectNamesCount > 0) {
    criticalErrors.push(`${suspectNamesCount} membre(s) ont un nom contenant des chiffres.`);
  }

  // 4. Parse ep+int sheet
  const savings: ImportSavingsRow[] = [];
  // Postes comptables spéciaux (SECOURS / CAYA, BUREAU, AUTRES / FETE) — pas des membres
  const specialAccountsMap = new Map<SpecialAccountKind, ImportSpecialAccountRow>();
  const epIntSheet = summarySheets.get('ep+int');
  if (epIntSheet) {
    const nameCol = findNameColumn(epIntSheet);
    const headerRow = epIntSheet.getRow(1);

    // Find "EP <MONTH>" columns (deposit columns), skip EP+INT and CUMUL
    const depositCols = detectMonthColumns(headerRow, startMonth, {
      prefix: 'ep ',
      skipContaining: ['ep+int', 'ep +int', 'cumul', 'total', 'n a p'],
    });

    // Find recap columns
    let recapEpargneCol = -1;
    let recapInteretCol = -1;
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = str(cell.value).toUpperCase().trim();
      if (val === 'EPARGNE' || val === 'EP TOTALE') recapEpargneCol = colNumber;
      if (val === 'INTERET' || val === 'INTERETS' || val === 'INTÉRÊTS' || val === 'INTÉRÊT') recapInteretCol = colNumber;
    });

    if (depositCols.size === 0) {
      warnings.push('ep+int : colonnes EP mensuelles non détectées');
    }

    epIntSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (!nameVal || !isNameCell(row.getCell(nameCol).value)) return;

      const deposits: Record<number, number> = {};
      for (const [col, sessMonth] of depositCols) {
        const amt = num(row.getCell(col).value);
        if (amt > 0) deposits[sessMonth] = amt;
      }

      const totalDeposit = recapEpargneCol > 0
        ? num(row.getCell(recapEpargneCol).value)
        : Object.values(deposits).reduce((s, v) => s + v, 0);
      const totalInterest = recapInteretCol > 0
        ? num(row.getCell(recapInteretCol).value)
        : 0;

      // Poste comptable spécial → on l'agrège à part (jamais un membre)
      const special = classifySpecialAccount(nameVal);
      if (special) {
        const acc = specialAccountsMap.get(special) ?? {
          label: nameVal,
          kind: special,
          deposits: {} as Record<number, number>,
          totalDeposit: 0,
          totalInterest: 0,
        };
        for (const [m, v] of Object.entries(deposits)) {
          acc.deposits[Number(m)] = (acc.deposits[Number(m)] ?? 0) + v;
        }
        acc.totalDeposit += totalDeposit;
        acc.totalInterest += totalInterest;
        specialAccountsMap.set(special, acc);
        return;
      }

      const interests: Record<number, number> = {};
      if (totalInterest > 0) interests[12] = totalInterest;

      savings.push({ memberName: nameVal, deposits, interests, totalDeposit, totalInterest });
    });
  } else {
    warnings.push('Feuille "ep+int" non trouvée');
  }

  // 5. Parse prets sheet
  const loans: ImportLoanRow[] = [];
  const pretsSheet = summarySheets.get('prets');
  if (pretsSheet) {
    const nameCol = findNameColumn(pretsSheet);
    const headerRow = pretsSheet.getRow(1);
    const monthCols = detectMonthColumns(headerRow, startMonth);

    let colPrets = -1, colInter = -1, colRemb = -1, colReste = -1;
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = str(cell.value).toUpperCase().trim();
      if (val === 'PRETS' || val === 'PRÊTS') colPrets = colNumber;
      if (val === 'INTER') colInter = colNumber;
      if (val === 'REMB') colRemb = colNumber;
      if (val === 'RESTE') colReste = colNumber;
    });

    pretsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (!nameVal || !isNameCell(row.getCell(nameCol).value)) return;
      if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre

      const disbursements: Record<number, number> = {};
      for (const [col, sessMonth] of monthCols) {
        const amt = num(row.getCell(col).value);
        if (amt > 0) disbursements[sessMonth] = amt;
      }

      const hasDisbursements = Object.values(disbursements).some((v) => v > 0);
      const totalPrets = colPrets > 0 ? num(row.getCell(colPrets).value) : 0;
      if (!hasDisbursements && totalPrets <= 0) return;

      loans.push({
        memberName: nameVal,
        disbursements,
        totalInterest: colInter > 0 ? num(row.getCell(colInter).value) : 0,
        totalRepaid: colRemb > 0 ? num(row.getCell(colRemb).value) : 0,
        outstanding: colReste > 0 ? num(row.getCell(colReste).value) : 0,
      });
    });
  } else {
    warnings.push('Feuille "prets" non trouvée');
  }

  // 6. Parse Rem sheet (repayments)
  const repayments: ImportRepaymentRow[] = [];
  const remSheet = summarySheets.get('rem');
  if (remSheet) {
    const nameCol = findNameColumn(remSheet);
    const headerRow = remSheet.getRow(1);
    const monthCols = detectMonthColumns(headerRow, startMonth);

    remSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (!nameVal || !isNameCell(row.getCell(nameCol).value)) return;
      if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre

      const reps: Record<number, number> = {};
      for (const [col, sessMonth] of monthCols) {
        const amt = num(row.getCell(col).value);
        if (amt > 0) reps[sessMonth] = amt;
      }

      if (Object.values(reps).some((v) => v > 0)) {
        repayments.push({ memberName: nameVal, repayments: reps });
      }
    });
  } else {
    warnings.push('Feuille "Rem" non trouvée');
  }

  // 7. Parse intérêts sheet
  const interests: ImportInterestRow[] = [];
  const interetsSheet = summarySheets.get('interets');
  if (interetsSheet) {
    const nameCol = findNameColumn(interetsSheet);
    const headerRow = interetsSheet.getRow(1);
    const monthCols = detectMonthColumns(headerRow, startMonth);

    interetsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (!nameVal || !isNameCell(row.getCell(nameCol).value)) return;
      if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre

      const ints: Record<number, number> = {};
      for (const [col, sessMonth] of monthCols) {
        const amt = num(row.getCell(col).value);
        if (amt > 0) ints[sessMonth] = amt;
      }

      if (Object.values(ints).some((v) => v > 0)) {
        interests.push({ memberName: nameVal, interests: ints });
      }
    });
  } else {
    warnings.push('Feuille "intérêts" non trouvée');
  }

  // 8. Parse insc+sec sheet
  const rescueFund: ImportRescueFundRow[] = [];
  const inscSecSheet = summarySheets.get('insc+sec');
  if (inscSecSheet) {
    const nameCol = findNameColumn(inscSecSheet);
    const headerRow = inscSecSheet.getRow(1);

    // Find inscription column
    let inscCol = -1;
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = normStr(str(cell.value));
      if (val.includes('inscription') || val === 'insc') inscCol = colNumber;
    });
    if (inscCol < 0) inscCol = nameCol + 1; // assume right after name

    // Month columns — headers are "SEC SEPT", "SEC OCT", etc.
    const monthCols = new Map<number, number>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      if (colNumber === inscCol) return;
      const raw = normStr(str(cell.value));
      if (raw.includes('total') || raw.includes('inscription') || raw.includes('noms')) return;
      // Strip "sec " prefix
      const cleaned = raw.replace(/^sec\s+/, '');
      const month = parseMonthName(cleaned);
      if (month != null) {
        let sm = month - startMonth + 1;
        if (sm <= 0) sm += 12;
        if (sm >= 1 && sm <= 12) monthCols.set(colNumber, sm);
      }
    });

    inscSecSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (!nameVal || !isNameCell(row.getCell(nameCol).value)) return;
      if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre

      const contributions: Record<number, number> = {};
      for (const [col, sessMonth] of monthCols) {
        const amt = num(row.getCell(col).value);
        if (amt > 0) contributions[sessMonth] = amt;
      }

      rescueFund.push({
        memberName: nameVal,
        inscription: num(row.getCell(inscCol).value),
        contributions,
      });
    });
  } else {
    warnings.push('Feuille "insc+sec" non trouvée');
  }

  // 9. Parse session sheets
  const sessions: ImportSessionData[] = [];

  for (const ss of sessionSheets) {
    // Map session month to session number (1-12)
    let sessionNumber = ss.month - startMonth + 1;
    if (sessionNumber <= 0) sessionNumber += 12;

    const ws = ss.ws;
    const nameCol = findNameColumn(ws);
    const headerRow = ws.getRow(1);
    const colMap: Record<string, number> = {};

    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const val = normStr(str(cell.value));
      if (val.includes('inscription') || val === 'insc') colMap['inscription'] = colNumber;
      if (val.includes('secours') || val === 'sec') colMap['secours'] = colNumber;
      if (val.includes('cotisation') || val.includes('tontine') || val === 'cot') colMap['tontine'] = colNumber;
      if (val === 'pot' || val.includes('pot')) colMap['pot'] = colNumber;
      if (val.includes('rem_pret') || val.includes('rem pret') || val.includes('rbt')) colMap['remPret'] = colNumber;
      if (val.includes('epargne') || val === 'ep') colMap['epargne'] = colNumber;
      if ((val.includes('pret') || val.includes('prêt')) && !val.includes('rem') && !val.includes('rbt')) colMap['pret'] = colNumber;
      if (val.includes('projet') || val === 'prj') colMap['projet'] = colNumber;
      if (val.includes('autre') || val === 'aut') colMap['autres'] = colNumber;
    });

    const entries: ImportSessionEntryRow[] = [];
    let ended = false;
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= 1 || ended) return;
      const nameVal = str(row.getCell(nameCol).value);
      if (isSessionTerminator(nameVal)) { ended = true; return; }
      if (!nameVal || !isNameCell(row.getCell(nameCol).value)) return;
      if (classifySpecialAccount(nameVal)) return; // poste comptable, pas un membre
      if (isCashbookLabel(nameVal)) return; // libellé de cashbook, pas un membre

      entries.push({
        memberName: nameVal,
        inscription: colMap['inscription'] ? num(row.getCell(colMap['inscription']).value) : 0,
        secours: colMap['secours'] ? num(row.getCell(colMap['secours']).value) : 0,
        tontine: colMap['tontine'] ? num(row.getCell(colMap['tontine']).value) : 0,
        pot: colMap['pot'] ? num(row.getCell(colMap['pot']).value) : 0,
        remPret: colMap['remPret'] ? num(row.getCell(colMap['remPret']).value) : 0,
        epargne: colMap['epargne'] ? num(row.getCell(colMap['epargne']).value) : 0,
        pret: colMap['pret'] ? num(row.getCell(colMap['pret']).value) : 0,
        projet: colMap['projet'] ? num(row.getCell(colMap['projet']).value) : 0,
        autres: colMap['autres'] ? num(row.getCell(colMap['autres']).value) : 0,
      });
    });

    sessions.push({ sessionNumber, entries });
  }

  // Vérification globale des montants négatifs
  let negativeAmountsCount = 0;
  for (const s of savings) {
    if (s.totalDeposit < 0 || s.totalInterest < 0 || Object.values(s.deposits).some(v => v < 0)) negativeAmountsCount++;
  }
  for (const l of loans) {
    if (l.totalInterest < 0 || l.totalRepaid < 0 || l.outstanding < 0 || Object.values(l.disbursements).some(v => v < 0)) negativeAmountsCount++;
  }
  for (const r of repayments) {
    if (Object.values(r.repayments).some(v => v < 0)) negativeAmountsCount++;
  }
  for (const sess of sessions) {
    for (const e of sess.entries) {
      if (e.inscription < 0 || e.tontine < 0 || e.pot < 0 || e.remPret < 0 || e.epargne < 0 || e.pret < 0 || e.secours < 0 || e.projet < 0 || e.autres < 0) {
        negativeAmountsCount++;
      }
    }
  }

  if (negativeAmountsCount > 0) {
    criticalErrors.push(`${negativeAmountsCount} montants négatifs ont été détectés, ce qui corrompra la comptabilité.`);
  }

  const specialAccounts = Array.from(specialAccountsMap.values());

  // Avertissement : comptes spéciaux détectés (traités comme postes de pool, pas comme membres)
  if (specialAccounts.length > 0) {
    warnings.push(
      `Lignes spéciales détectées (postes comptables, exclues des membres) : ${specialAccounts
        .map((a) => a.label)
        .join(', ')}.`,
    );
  }

  // Avertissement : aucune session → historique des réunions vide
  if (sessions.length === 0) {
    warnings.push(
      'Aucune session mensuelle détectée : seuls les soldes annuels (épargne, prêts, secours) seront importés. ' +
        'Le détail des réunions mois par mois sera vide.',
    );
  }

  // Avertissement : noms quasi-dupliqués (probables doublons / fautes de frappe)
  const dupPairs: string[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = normStr(members[i]);
      const b = normStr(members[j]);
      if (a.length >= 6 && b.length >= 6 && Math.abs(a.length - b.length) <= 2 && levenshtein(a, b) <= 2) {
        dupPairs.push(`"${members[i]}" ≈ "${members[j]}"`);
      }
    }
  }
  if (dupPairs.length > 0) {
    warnings.push(
      `Noms très proches (vérifiez s'il s'agit de doublons) : ${dupPairs.slice(0, 8).join(' ; ')}` +
        (dupPairs.length > 8 ? ` … (+${dupPairs.length - 8})` : ''),
    );
  }

  return {
    data: {
      label,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      members,
      savings,
      loans,
      repayments,
      interests,
      rescueFund,
      sessions,
      specialAccounts,
    },
    warnings,
    criticalErrors,
  };
}

/* ── Inference helpers ── */

/** Look at the first "EP <MONTH>" header in ep+int to determine the fiscal year start month */
function inferStartMonthFromHeaders(ws: ExcelJS.Worksheet | undefined): number | null {
  if (!ws) return null;
  const headerRow = ws.getRow(1);
  let firstMonth: number | null = null;

  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    if (firstMonth != null) return;
    const val = normStr(str(cell.value));
    if (val.startsWith('ep ') && !val.includes('+') && !val.includes('total')) {
      const monthPart = val.replace('ep ', '').trim();
      firstMonth = parseMonthName(monthPart);
    }
  });

  return firstMonth;
}

/** Try to extract a year from sheet names like "prets25", "Rem25", "Oct.25" */
function guessYearFromSheetNames(wb: ExcelJS.Workbook): number | null {
  for (const ws of wb.worksheets) {
    const match = ws.name.match(/(\d{2})(?:\s*\(\d+\))?$/);
    if (match) return 2000 + parseInt(match[1], 10);
  }
  return null;
}
