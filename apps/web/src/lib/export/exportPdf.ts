import jsPDF from 'jspdf';
import type { SavingsLedger, MonthlySession, BeneficiarySchedule, BeneficiarySlot, LoanAccount, SavingsEntry, CassationRecord, FiscalYear, Membership } from '@/types/api.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_FR: Record<string, string> = {
  OPEN:       'Ouverte',
  DRAFT:      'Brouillon',
  REVIEWING:  'En révision',
  CLOSED:     'Clôturée',
  PENDING:    'En attente',
  ACTIVE:     'En cours',
  DELIVERED:  'Livré',
  ASSIGNED:   'Désigné',
  UNASSIGNED: 'Non attribué',
};

function fmtXAF(v: number): string {
  return v.toLocaleString('fr-FR') + ' XAF';
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR');
}

// ── Cover page ────────────────────────────────────────────────────────────────

function coverPage(
  doc: jsPDF,
  reportTitle: string,
  fyLabel: string,
  stats: { label: string; value: string }[],
) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Top banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageW, 55, 'F');

  // Accent stripe
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 55, pageW, 3, 'F');

  // CAYA title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('CAYA', pageW / 2, 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Coopérative d\'Autofinancement des Yassites d\'Akwa', pageW / 2, 40, { align: 'center' });
  doc.text('Document confidentiel — usage interne exclusif', pageW / 2, 50, { align: 'center' });

  // Report title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(reportTitle, pageW / 2, 82, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(fyLabel, pageW / 2, 94, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 104, { align: 'center' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 112, pageW - 14, 112);

  // Stats cards grid (2 columns)
  const cols = 2;
  const colW = (pageW - 28 - 4) / cols;
  stats.forEach(({ label, value }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const sx = 14 + col * (colW + 4);
    const sy = 118 + row * 26;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(sx, sy, colW, 22, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(label, sx + 4, sy + 8);

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(value, sx + 4, sy + 17);
    doc.setFont('helvetica', 'normal');
  });

  // Footer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text('CAYA — Confidentiel', 14, pageH - 5);
  doc.text(`Page 1`, pageW - 14, pageH - 5, { align: 'right' });
}

// ── Common page header ────────────────────────────────────────────────────────

function pageHeader(doc: jsPDF, title: string, fyLabel: string) {
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CAYA', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(title, 38, 12);
  doc.text(fyLabel, doc.internal.pageSize.getWidth() - 14, 12, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

// ── Footers ───────────────────────────────────────────────────────────────────

function addFooters(doc: jsPDF, startPage = 1) {
  const totalPages = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = startPage; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('CAYA — Confidentiel', 14, pageH - 5);
    doc.text(`Page ${i}/${totalPages}`, pageW - 14, pageH - 5, { align: 'right' });
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageW / 2, pageH - 5, { align: 'center' });
  }
  doc.setTextColor(0, 0, 0);
}

// ── Bar chart (drawn with jsPDF primitives) ───────────────────────────────────

function drawBarChart(
  doc: jsPDF,
  data: { label: string; value: number }[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = w / data.length;
  const COLORS: [number, number, number][] = [
    [59, 130, 246], [16, 185, 129], [245, 158, 11],
    [139, 92, 246], [244, 63, 94], [20, 184, 166],
  ];

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(title, x, y - 5);

  // Y axis
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(x, y, x, y + h);
  doc.line(x, y + h, x + w, y + h);

  // Y axis ticks (3 gridlines)
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  [0.5, 1.0].forEach((pct) => {
    const gy = y + h - pct * h;
    doc.setDrawColor(241, 245, 249);
    doc.line(x, gy, x + w, gy);
    const gVal = maxVal * pct;
    doc.text(gVal >= 1000 ? `${Math.round(gVal / 1000)}k` : String(Math.round(gVal)), x - 1, gy + 1, { align: 'right' });
  });

  data.forEach((d, i) => {
    const barH = maxVal > 0 ? (d.value / maxVal) * h : 0;
    const bx = x + i * barW + barW * 0.15;
    const bw = barW * 0.7;
    const by = y + h - barH;
    const [r, g, b] = COLORS[i % COLORS.length];

    doc.setFillColor(r, g, b);
    if (barH > 0.5) doc.rect(bx, by, bw, barH, 'F');

    // Value on top
    if (d.value > 0) {
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      const valStr = d.value >= 1000 ? `${Math.round(d.value / 1000)}k` : String(Math.round(d.value));
      doc.text(valStr, bx + bw / 2, Math.max(by - 1, y), { align: 'center' });
    }

    // X label
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(d.label, bx + bw / 2, y + h + 4.5, { align: 'center' });
  });
}

// ── Section heading ───────────────────────────────────────────────────────────

function sectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, doc.internal.pageSize.getWidth() - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(text, 16, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  return y + 6;
}

// ── Table helpers ─────────────────────────────────────────────────────────────

function tableRow(
  doc: jsPDF,
  y: number,
  cols: string[],
  widths: number[],
  x0 = 14,
  align: ('left' | 'right')[] = [],
) {
  let x = x0;
  cols.forEach((text, i) => {
    const a = align[i] ?? 'left';
    if (a === 'right') {
      doc.text(String(text ?? '—'), x + widths[i] - 2, y, { align: 'right' });
    } else {
      doc.text(String(text ?? '—'), x + 1, y);
    }
    x += widths[i];
  });
}

function simpleTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  widths: number[],
  startY = 28,
  totalsRow?: string[],
  colAlign?: ('left' | 'right')[],
): number {
  const ROW_H = 7;
  const tableW = widths.reduce((a, b) => a + b, 0);
  let y = startY;
  const pageH = doc.internal.pageSize.getHeight();

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, tableW, ROW_H, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  tableRow(doc, y, headers, widths, 14, colAlign);
  y += ROW_H;

  doc.setFont('helvetica', 'normal');
  rows.forEach((row, i) => {
    if (y > pageH - 18) { doc.addPage(); pageHeader(doc, '', ''); y = 26; }
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, tableW, ROW_H, 'F');
    }
    tableRow(doc, y, row, widths, 14, colAlign);
    y += ROW_H;
  });

  if (totalsRow) {
    if (y > pageH - 18) { doc.addPage(); pageHeader(doc, '', ''); y = 26; }
    doc.setFillColor(226, 232, 240);
    doc.rect(14, y - 5, tableW, ROW_H, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    tableRow(doc, y, totalsRow, widths, 14, colAlign);
    doc.setFont('helvetica', 'normal');
    y += ROW_H;
  }

  return y;
}

// ── Exports ───────────────────────────────────────────────────────────────────

export function exportSavingsToPdf(
  ledgers: SavingsLedger[],
  fyLabel: string,
  memberMap?: Record<string, string>,
) {
  const doc = new jsPDF();

  const totalBalance  = ledgers.reduce((s, l) => s + parseFloat(l.balance), 0);
  const totalPrincipal = ledgers.reduce((s, l) => s + parseFloat(l.principalBalance), 0);
  const totalInterest  = ledgers.reduce((s, l) => s + parseFloat(l.totalInterestReceived), 0);

  coverPage(doc, 'Rapport Épargnes', fyLabel, [
    { label: 'Membres avec épargne', value: String(ledgers.length) },
    { label: 'Solde total cumulé', value: fmtXAF(totalBalance) },
    { label: 'Capital versé total', value: fmtXAF(totalPrincipal) },
    { label: 'Intérêts distribués', value: fmtXAF(totalInterest) },
  ]);

  doc.addPage();
  pageHeader(doc, 'Rapport Épargnes', fyLabel);

  const headers = ['Membre', 'Solde (XAF)', 'Capital (XAF)', 'Intérêts (XAF)'];
  const widths = [65, 42, 42, 42];
  const align: ('left' | 'right')[] = ['left', 'right', 'right', 'right'];

  const rows = ledgers.map((l) => [
    memberMap?.[l.membershipId] ?? l.membershipId.slice(-8),
    parseFloat(l.balance).toLocaleString('fr-FR'),
    parseFloat(l.principalBalance).toLocaleString('fr-FR'),
    parseFloat(l.totalInterestReceived).toLocaleString('fr-FR'),
  ]);

  const totalsRow = [
    `Total (${ledgers.length} membres)`,
    totalBalance.toLocaleString('fr-FR'),
    totalPrincipal.toLocaleString('fr-FR'),
    totalInterest.toLocaleString('fr-FR'),
  ];

  simpleTable(doc, headers, rows, widths, 28, totalsRow, align);
  addFooters(doc, 2);
  doc.save(`epargnes_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

export function exportSessionsToPdf(
  sessions: MonthlySession[],
  fyLabel: string,
  memberMap?: Record<string, string>,
  beneficiaries?: BeneficiarySchedule,
  savings?: SavingsLedger[],
  loans?: LoanAccount[],
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ── Totaux globaux ──
  const sum = (field: keyof MonthlySession) =>
    sessions.reduce((s, sess) => s + parseFloat((sess[field] as string) || '0'), 0);

  const grandTotal = sessions.reduce((s, sess) => {
    return s + [sess.totalCotisation, sess.totalPot, sess.totalInscription, sess.totalSecours,
      sess.totalRbtPrincipal, sess.totalRbtInterest, sess.totalEpargne, sess.totalProjet, sess.totalAutres]
      .reduce((a, v) => a + parseFloat(v || '0'), 0);
  }, 0);

  // ── Cover page ──
  coverPage(doc, 'Rapport Sessions', fyLabel, [
    { label: 'Sessions', value: `${sessions.length} session${sessions.length > 1 ? 's' : ''}` },
    { label: 'Total collecté', value: fmtXAF(grandTotal) },
    { label: 'Total cotisations', value: fmtXAF(sum('totalCotisation')) },
    { label: 'Total épargnes', value: fmtXAF(sum('totalEpargne')) },
    { label: 'Total remboursements', value: fmtXAF(sum('totalRbtPrincipal') + sum('totalRbtInterest')) },
    { label: 'Total pots distribués', value: fmtXAF(sum('totalPot')) },
  ]);

  // ── Page 2 : Graphique + tableau récapitulatif ──
  doc.addPage();
  pageHeader(doc, 'Synthèse des Sessions', fyLabel);

  // Bar chart — total collecté par session
  const chartData = sessions.map((s) => ({
    label: `S${s.sessionNumber}`,
    value: [s.totalCotisation, s.totalPot, s.totalInscription, s.totalSecours,
      s.totalRbtPrincipal, s.totalRbtInterest, s.totalEpargne, s.totalProjet, s.totalAutres]
      .reduce((a, v) => a + parseFloat(v || '0'), 0),
  }));

  drawBarChart(doc, chartData, 14, 34, pageW - 28, 50, 'Total collecté par session (XAF)');

  let y = 100;
  y = sectionHeading(doc, 'Détail par session et par type de transaction', y);

  const headers = ['Session', 'Date', 'Statut', 'Inscript.', 'Cotis.', 'Épargne', 'Secours', 'Pot', 'Rbt.Prêts', 'Total'];
  const widths  = [18, 22, 20, 24, 24, 22, 20, 22, 24, 26];
  const align: ('left' | 'right')[] = ['left', 'left', 'left', 'right', 'right', 'right', 'right', 'right', 'right', 'right'];

  const rows = sessions.map((s) => {
    const total = chartData.find((d) => d.label === `S${s.sessionNumber}`)?.value ?? 0;
    return [
      `#${s.sessionNumber}`,
      fmtDate(s.meetingDate),
      STATUS_FR[s.status] ?? s.status,
      parseFloat(s.totalInscription || '0').toLocaleString('fr-FR'),
      parseFloat(s.totalCotisation  || '0').toLocaleString('fr-FR'),
      parseFloat(s.totalEpargne     || '0').toLocaleString('fr-FR'),
      parseFloat(s.totalSecours     || '0').toLocaleString('fr-FR'),
      parseFloat(s.totalPot         || '0').toLocaleString('fr-FR'),
      (parseFloat(s.totalRbtPrincipal || '0') + parseFloat(s.totalRbtInterest || '0')).toLocaleString('fr-FR'),
      total.toLocaleString('fr-FR'),
    ];
  });

  const totalsRow = [
    'TOTAL', '', '',
    sum('totalInscription').toLocaleString('fr-FR'),
    sum('totalCotisation').toLocaleString('fr-FR'),
    sum('totalEpargne').toLocaleString('fr-FR'),
    sum('totalSecours').toLocaleString('fr-FR'),
    sum('totalPot').toLocaleString('fr-FR'),
    (sum('totalRbtPrincipal') + sum('totalRbtInterest')).toLocaleString('fr-FR'),
    grandTotal.toLocaleString('fr-FR'),
  ];

  y = simpleTable(doc, headers, rows, widths, y, totalsRow, align);

  // ── Page 3+ : Détail par session ──
  sessions.forEach((session) => {
    // N'ajouter une page détaillée que si la session a des transactions
    const hasEntries = session.entries && session.entries.length > 0;
    if (!hasEntries) return;

    doc.addPage();
    pageHeader(doc, `Session #${session.sessionNumber}`, fyLabel);

    // En-tête de session
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const meta = [
      `Date : ${fmtDate(session.meetingDate)}`,
      `Statut : ${STATUS_FR[session.status] ?? session.status}`,
      session.location ? `Lieu : ${session.location}` : '',
    ].filter(Boolean).join('   ·   ');
    doc.text(meta, 14, 26);
    doc.setTextColor(0, 0, 0);

    let sy = 34;


    // Transactions de cette session (si disponibles)
    if (hasEntries && session.entries) {
      sy = sectionHeading(doc, 'Transactions enregistrées', sy);
      const TRANS_LABELS: Record<string, string> = {
        INSCRIPTION:   'Inscription',
        COTISATION:    'Cotisation',
        EPARGNE:       'Épargne',
        SECOURS:       'Secours',
        POT:           'Pot',
        RBT_PRINCIPAL: 'Rbt. Principal',
        RBT_INTEREST:  'Rbt. Intérêts',
        PROJET:        'Projet',
        AUTRES:        'Autres',
      };
      const tHeaders = ['Référence', 'Membre', 'Type', 'Montant (XAF)', 'Notes'];
      const tWidths  = [30, 70, 30, 36, 56];
      const tAlign: ('left' | 'right')[] = ['left', 'left', 'left', 'right', 'left'];
      const tRows = session.entries.map((e) => {
        const memberName = e.membership?.profile
          ? `${e.membership.profile.lastName} ${e.membership.profile.firstName}`
          : (memberMap?.[e.membershipId] ?? e.membershipId.slice(-6));
        return [
          e.reference ?? '—',
          memberName,
          TRANS_LABELS[e.type] ?? e.type,
          parseFloat(e.amount).toLocaleString('fr-FR'),
          e.notes ?? '',
        ];
      });
      const totalEntries = session.entries.reduce((s, e) => s + parseFloat(e.amount), 0);
      const tTotals = ['', `${session.entries.length} entrée${session.entries.length > 1 ? 's' : ''}`, '', totalEntries.toLocaleString('fr-FR'), ''];
      simpleTable(doc, tHeaders, tRows, tWidths, sy, tTotals, tAlign);
    }
  });

  // ── Page finale : Bénéficiaires complets ──
  if (beneficiaries && (beneficiaries.slots ?? []).length > 0) {
    doc.addPage();
    pageHeader(doc, 'Tableau des Bénéficiaires', fyLabel);

    let by = 28;
    by = sectionHeading(doc, 'Rotation complète des bénéficiaires', by);

    const bHeaders = ['Mois', 'Slot', 'Bénéficiaire', 'Code', 'Montant (XAF)', 'Hôte', 'Statut'];
    const bWidths  = [14, 14, 64, 28, 36, 14, 52];
    const bAlign: ('left' | 'right')[] = ['left', 'left', 'left', 'left', 'right', 'left', 'left'];

    const slots = beneficiaries.slots ?? [];
    const bRows = slots.map((sl) => [
      `M${sl.month}`,
      `#${sl.slotIndex}`,
      sl.membership?.profile
        ? `${sl.membership.profile.lastName} ${sl.membership.profile.firstName}`
        : '—',
      sl.membership?.profile?.memberCode ?? '—',
      parseFloat(sl.amountDelivered || '0').toLocaleString('fr-FR'),
      sl.isHost ? 'Oui' : '',
      STATUS_FR[sl.status] ?? sl.status,
    ]);

    const deliveredCount = slots.filter((s) => s.status === 'DELIVERED').length;
    const totalDelivered = slots.filter((s) => s.status === 'DELIVERED')
      .reduce((s, sl) => s + parseFloat(sl.amountDelivered || '0'), 0);
    const bTotals = ['', `${deliveredCount} livrés`, '', '', totalDelivered.toLocaleString('fr-FR'), '', ''];

    simpleTable(doc, bHeaders, bRows, bWidths, by, bTotals, bAlign);
  }

  // ── Page : Tableau des Épargnes ──
  if (savings && savings.length > 0) {
    doc.addPage();
    pageHeader(doc, 'Tableau des Épargnes', fyLabel);
    let ey = 28;
    ey = sectionHeading(doc, 'Synthèse des épargnes par membre', ey);

    const sHeaders = ['Membre', 'Solde (XAF)', 'Capital (XAF)', 'Intérêts (XAF)'];
    const sWidths  = [120, 50, 50, 50];
    const sAlign: ('left' | 'right')[] = ['left', 'right', 'right', 'right'];

    const sRows = savings.map((l) => [
      memberMap?.[l.membershipId] ?? l.membershipId.slice(-8),
      parseFloat(l.balance).toLocaleString('fr-FR'),
      parseFloat(l.principalBalance).toLocaleString('fr-FR'),
      parseFloat(l.totalInterestReceived).toLocaleString('fr-FR'),
    ]);

    const totalBalance = savings.reduce((s, l) => s + parseFloat(l.balance), 0);
    const sTotals = [`Total (${savings.length} membres)`, totalBalance.toLocaleString('fr-FR'), '', ''];

    simpleTable(doc, sHeaders, sRows, sWidths, ey, sTotals, sAlign);
  }

  // ── Page : Tableau des Prêts ──
  if (loans && loans.length > 0) {
    doc.addPage();
    pageHeader(doc, 'Tableau des Prêts', fyLabel);
    let ly = 28;
    ly = sectionHeading(doc, 'Synthèse des prêts de l\'exercice', ly);

    const lHeaders = ['Membre', 'Principal', 'Taux', 'Reste à payer', 'Total remboursé', 'Statut'];
    const lWidths = [80, 40, 20, 45, 45, 40];
    const lAlign: ('left' | 'right')[] = ['left', 'right', 'right', 'right', 'right', 'left'];

    const lRows = loans.map((loan) => [
      memberMap?.[loan.membershipId] ?? loan.membershipId.slice(-8),
      parseFloat(loan.principalAmount).toLocaleString('fr-FR'),
      `${(parseFloat(loan.monthlyRate) * 100).toFixed(1)}%`,
      parseFloat(loan.outstandingBalance).toLocaleString('fr-FR'),
      parseFloat(loan.totalRepaid).toLocaleString('fr-FR'),
      STATUS_FR[loan.status] ?? loan.status,
    ]);

    const totalOutstanding = loans.reduce((s, l) => s + parseFloat(l.outstandingBalance), 0);
    const lTotals = ['TOTAL', '', '', totalOutstanding.toLocaleString('fr-FR'), '', ''];

    simpleTable(doc, lHeaders, lRows, lWidths, ly, lTotals, lAlign);
  }

  addFooters(doc, 2);
  doc.save(`sessions_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

export function exportBeneficiariesToPdf(schedule: BeneficiarySchedule, fyLabel: string) {
  const doc = new jsPDF();

  const slots = schedule.slots ?? [];
  const deliveredCount = slots.filter((s) => s.status === 'DELIVERED').length;
  const totalDelivered = slots.filter((s) => s.status === 'DELIVERED')
    .reduce((sum, s) => sum + parseFloat(s.amountDelivered || '0'), 0);

  coverPage(doc, 'Tableau des Bénéficiaires', fyLabel, [
    { label: 'Total slots', value: String(slots.length) },
    { label: 'Livrés', value: `${deliveredCount} / ${slots.length}` },
    { label: 'Total distribué', value: fmtXAF(totalDelivered) },
    { label: 'En attente', value: String(slots.filter((s) => s.status === 'ASSIGNED').length) },
  ]);

  doc.addPage();
  pageHeader(doc, 'Tableau Bénéficiaires', fyLabel);

  const headers = ['Mois', 'Slot', 'Bénéficiaire', 'Code', 'Montant (XAF)', 'Hôte', 'Statut'];
  const widths  = [14, 14, 58, 24, 34, 14, 28];
  const align: ('left' | 'right')[] = ['left', 'left', 'left', 'left', 'right', 'left', 'left'];

  const rows = slots.map((slot) => [
    `M${slot.month}`,
    `#${slot.slotIndex}`,
    slot.membership?.profile
      ? `${slot.membership.profile.lastName} ${slot.membership.profile.firstName}`
      : '—',
    slot.membership?.profile?.memberCode ?? '—',
    parseFloat(slot.amountDelivered || '0').toLocaleString('fr-FR'),
    slot.isHost ? 'Oui' : '',
    STATUS_FR[slot.status] ?? slot.status,
  ]);

  const totalsRow = ['', `${deliveredCount} livrés`, '', '', totalDelivered.toLocaleString('fr-FR'), '', ''];

  simpleTable(doc, headers, rows, widths, 28, totalsRow, align);
  addFooters(doc, 2);
  doc.save(`beneficiaires_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

// ── Export prêts ──────────────────────────────────────────────────────────────

export function exportLoansToPdf(
  loans: LoanAccount[],
  fyLabel: string,
  memberMap?: Record<string, string>,
) {
  const doc = new jsPDF({ orientation: 'landscape' });

  const activeLoans  = loans.filter((l) => l.status !== 'CLOSED');
  const totalPrincipal  = loans.reduce((s, l) => s + parseFloat(l.principalAmount || '0'), 0);
  const totalOutstanding = activeLoans.reduce((s, l) => s + parseFloat(l.outstandingBalance || '0'), 0);
  const totalRepaid  = loans.reduce((s, l) => s + parseFloat(l.totalRepaid || '0'), 0);

  coverPage(doc, 'Tableau des Prêts', fyLabel, [
    { label: 'Total prêts', value: String(loans.length) },
    { label: 'Prêts actifs', value: String(activeLoans.length) },
    { label: 'Capital total', value: fmtXAF(totalPrincipal) },
    { label: 'Solde restant', value: fmtXAF(totalOutstanding) },
    { label: 'Total remboursé', value: fmtXAF(totalRepaid) },
  ]);

  doc.addPage();
  pageHeader(doc, 'Tableau des Prêts', fyLabel);

  const headers = ['Membre', 'Code', 'Capital (XAF)', 'Intérêts (XAF)', 'Remboursé (XAF)', 'Solde (XAF)', 'Date emprunt', 'Échéance', 'Statut'];
  const widths  = [46, 22, 30, 26, 30, 26, 24, 24, 24];
  const align: ('left' | 'right')[] = ['left', 'left', 'right', 'right', 'right', 'right', 'left', 'left', 'left'];

  const rows = loans.map((l) => {
    const name = memberMap?.[l.membershipId] ?? l.membershipId.slice(-6);
    const code = memberMap?.[`code_${l.membershipId}`] ?? '—';
    return [
      name,
      code,
      parseFloat(l.principalAmount || '0').toLocaleString('fr-FR'),
      parseFloat(l.totalInterestAccrued || '0').toLocaleString('fr-FR'),
      parseFloat(l.totalRepaid || '0').toLocaleString('fr-FR'),
      parseFloat(l.outstandingBalance || '0').toLocaleString('fr-FR'),
      l.disbursedAt ? fmtDate(l.disbursedAt) : '—',
      l.dueBeforeDate ? fmtDate(l.dueBeforeDate) : '—',
      STATUS_FR[l.status] ?? l.status,
    ];
  });

  const totalsRow = [
    'TOTAL', '',
    totalPrincipal.toLocaleString('fr-FR'),
    '',
    totalRepaid.toLocaleString('fr-FR'),
    totalOutstanding.toLocaleString('fr-FR'),
    '', '', '',
  ];

  simpleTable(doc, headers, rows, widths, 28, totalsRow, align);
  addFooters(doc, 2);
  doc.save(`prets_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

// ── Export session détail ─────────────────────────────────────────────────────

export function exportSessionDetailToPdf(session: MonthlySession, fyLabel: string) {
  const doc = new jsPDF();

  const entries = session.entries ?? [];
  const totalGeneral = [
    session.totalCotisation, session.totalPot, session.totalInscription,
    session.totalSecours, session.totalRbtPrincipal, session.totalRbtInterest,
    session.totalEpargne, session.totalProjet, session.totalAutres,
  ].reduce((s, v) => s + parseFloat(v || '0'), 0);

  coverPage(doc, `Session #${session.sessionNumber}`, fyLabel, [
    { label: 'Date réunion', value: fmtDate(session.meetingDate) },
    { label: 'Lieu', value: session.location ?? '—' },
    { label: 'Statut', value: STATUS_FR[session.status] ?? session.status },
    { label: 'Total collecté', value: fmtXAF(totalGeneral) },
    { label: 'Transactions', value: String(entries.length) },
    { label: 'Participants', value: String(new Set(entries.map((e) => e.membershipId)).size) },
  ]);

  doc.addPage();
  pageHeader(doc, `Session #${session.sessionNumber} — Transactions`, fyLabel);

  const headers = ['Référence', 'Membre', 'Type', 'Montant (XAF)', 'Date'];
  const widths  = [44, 56, 34, 34, 24];
  const align: ('left' | 'right')[] = ['left', 'left', 'left', 'right', 'left'];

  const TYPE_LABELS: Record<string, string> = {
    COTISATION: 'Cotisation', INSCRIPTION: 'Inscription', EPARGNE: 'Épargne',
    SECOURS: 'Caisse secours', POT: 'Pot', RBT_PRINCIPAL: 'Remb. capital',
    RBT_INTEREST: 'Remb. intérêts', PROJET: 'Projet', AUTRES: 'Autres',
  };

  const rows = entries.map((e) => [
    e.reference,
    e.membership?.profile
      ? `${e.membership.profile.lastName} ${e.membership.profile.firstName}`
      : e.membershipId.slice(-8),
    TYPE_LABELS[e.type] ?? e.type,
    parseFloat(e.amount).toLocaleString('fr-FR'),
    fmtDate(e.recordedAt),
  ]);

  const totalsRow = ['', '', 'TOTAL', totalGeneral.toLocaleString('fr-FR'), ''];

  let y = simpleTable(doc, headers, rows, widths, 28, totalsRow, align);

  // Journal financier
  y += 8;
  if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); pageHeader(doc, '', ''); y = 28; }
  y = sectionHeading(doc, 'Journal Financier', y + 5);
  y += 4;

  const journalRows = ([
    ['Cotisation', parseFloat(session.totalCotisation || '0')],
    ['Épargne', parseFloat(session.totalEpargne || '0')],
    ['Caisse de secours', parseFloat(session.totalSecours || '0')],
    ['Projet', parseFloat(session.totalProjet || '0')],
    ['Pot', parseFloat(session.totalPot || '0')],
    ['Remb. capital', parseFloat(session.totalRbtPrincipal || '0')],
    ['Remb. intérêts', parseFloat(session.totalRbtInterest || '0')],
    ['Inscriptions', parseFloat(session.totalInscription || '0')],
    ['Autres', parseFloat(session.totalAutres || '0')],
  ] as [string, number][]).filter(([, v]) => v > 0);

  const jRows = journalRows.map(([label, v]) => [label, v.toLocaleString('fr-FR') + ' XAF']);
  simpleTable(doc, ['Rubrique (Recettes)', 'Montant'], jRows, [100, 82], y,
    ['TOTAL RECETTES', fmtXAF(totalGeneral)], ['left', 'right']);

  addFooters(doc, 2);
  doc.save(`session_${session.sessionNumber}_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

// ── Export membre détail ──────────────────────────────────────────────────────

interface MemberExportData {
  firstName: string;
  lastName: string;
  memberCode: string;
  phone?: string;
  neighborhood?: string;
  role: string;
  isActive: boolean;
  savingsBalance: string;
  savingsPrincipal: string;
  savingsInterests: string;
  savingsEntries?: SavingsEntry[];
  activeLoanAmount?: string;
  activeLoanOutstanding?: string;
  activeLoanStatus?: string;
  enrollments: { fyLabel: string; type: string; shares: string; joinedAt: string }[];
}

export function exportMemberToPdf(data: MemberExportData, fyLabel: string) {
  const doc = new jsPDF();

  const fullName = `${data.lastName} ${data.firstName}`;

  coverPage(doc, `Fiche Membre — ${fullName}`, fyLabel, [
    { label: 'Matricule', value: data.memberCode },
    { label: 'Statut', value: data.isActive ? 'Actif' : 'Inactif' },
    { label: 'Épargne (solde)', value: fmtXAF(parseFloat(data.savingsBalance || '0')) },
    { label: 'Prêt en cours', value: data.activeLoanAmount ? fmtXAF(parseFloat(data.activeLoanAmount)) : '—' },
  ]);

  doc.addPage();
  pageHeader(doc, `Fiche Membre — ${fullName}`, fyLabel);

  let y = 28;

  // Infos personnelles
  y = sectionHeading(doc, 'Informations personnelles', y + 5);
  y += 4;
  const infoRows = [
    ['Nom complet', fullName],
    ['Matricule', data.memberCode],
    ['Téléphone', data.phone ?? '—'],
    ['Quartier', data.neighborhood ?? '—'],
    ['Rôle', data.role],
    ['Statut', data.isActive ? 'Actif' : 'Inactif'],
  ];
  y = simpleTable(doc, ['Champ', 'Valeur'], infoRows, [70, 112], y, undefined, ['left', 'left']);

  // Épargne
  y += 6;
  y = sectionHeading(doc, 'Épargne', y + 5);
  y += 4;
  const savingsRows = [
    ['Solde total', fmtXAF(parseFloat(data.savingsBalance || '0'))],
    ['Capital versé', fmtXAF(parseFloat(data.savingsPrincipal || '0'))],
    ['Intérêts reçus', fmtXAF(parseFloat(data.savingsInterests || '0'))],
  ];
  y = simpleTable(doc, ['Métrique', 'Valeur'], savingsRows, [70, 112], y, undefined, ['left', 'right']);

  // Prêt actif
  if (data.activeLoanAmount) {
    y += 6;
    y = sectionHeading(doc, 'Prêt en cours', y + 5);
    y += 4;
    const loanRows = [
      ['Montant emprunté', fmtXAF(parseFloat(data.activeLoanAmount || '0'))],
      ['Solde restant', fmtXAF(parseFloat(data.activeLoanOutstanding || '0'))],
      ['Statut', STATUS_FR[data.activeLoanStatus ?? ''] ?? (data.activeLoanStatus ?? '—')],
    ];
    y = simpleTable(doc, ['Métrique', 'Valeur'], loanRows, [70, 112], y, undefined, ['left', 'right']);
  }

  // Historique inscriptions
  if (data.enrollments.length > 0) {
    y += 6;
    if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); pageHeader(doc, '', ''); y = 28; }
    y = sectionHeading(doc, 'Historique des inscriptions', y + 5);
    y += 4;
    const enrollRows = data.enrollments.map((e) => [e.fyLabel, e.type, e.shares, e.joinedAt]);
    simpleTable(doc, ['Exercice', 'Type', 'Parts', 'Date entrée'], enrollRows, [60, 40, 20, 62], y, undefined, ['left', 'left', 'right', 'left']);
  }

  addFooters(doc, 2);
  doc.save(`membre_${data.memberCode}_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

// ── Export Cassation ──────────────────────────────────────────────────────────

export function exportCassationToPdf(record: CassationRecord, fyLabel: string) {
  const doc = new jsPDF();

  const totalDistributed = parseFloat(record.totalDistributed);
  const totalSavings     = parseFloat(record.totalSavingsReturned);
  const totalInterest    = parseFloat(record.totalInterestReturned);

  coverPage(doc, 'Rapport de Cassation', fyLabel, [
    { label: 'Total distribué',    value: fmtXAF(totalDistributed) },
    { label: 'Capital restitué',   value: fmtXAF(totalSavings) },
    { label: 'Intérêts restitués', value: fmtXAF(totalInterest) },
    { label: 'Membres',            value: String(record.memberCount) },
    { label: 'Prêts reportés N+1', value: String(record.carryoverCount ?? 0) },
    { label: 'Exécuté le',         value: fmtDate(record.executedAt) },
  ]);

  doc.addPage();
  pageHeader(doc, 'Rapport de Cassation', fyLabel);

  let y = 28;

  // Notes
  if (record.notes) {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(14, y - 3, pageW - 28, 12, 1.5, 1.5, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(record.notes, 17, y + 4);
    doc.setTextColor(0, 0, 0);
    y += 18;
  }

  // Redistributions
  if (record.redistributions && record.redistributions.length > 0) {
    y = sectionHeading(doc, `Redistributions par membre (${record.redistributions.length})`, y + 4);
    y += 4;

    const headers = ['Membre', 'Matricule', 'Capital (XAF)', 'Intérêts (XAF)', 'Total (XAF)'];
    const widths  = [60, 26, 32, 32, 32];
    const align: ('left' | 'right')[] = ['left', 'left', 'right', 'right', 'right'];

    const rows = record.redistributions.map((r) => [
      r.membership?.profile
        ? `${r.membership.profile.lastName} ${r.membership.profile.firstName}`
        : r.membershipId.slice(-8),
      r.membership?.profile?.memberCode ?? '—',
      parseFloat(r.savingsAmount).toLocaleString('fr-FR'),
      parseFloat(r.interestAmount).toLocaleString('fr-FR'),
      parseFloat(r.totalReturned).toLocaleString('fr-FR'),
    ]);

    const totalsRow = [
      `Total — ${record.memberCount} membres`, '',
      totalSavings.toLocaleString('fr-FR'),
      totalInterest.toLocaleString('fr-FR'),
      totalDistributed.toLocaleString('fr-FR'),
    ];

    y = simpleTable(doc, headers, rows, widths, y, totalsRow, align);
  }

  // Parts institutionnelles
  if (record.participantShares && record.participantShares.length > 0) {
    y += 8;
    const pageH = doc.internal.pageSize.getHeight();
    if (y > pageH - 40) { doc.addPage(); pageHeader(doc, 'Rapport de Cassation', fyLabel); y = 28; }

    y = sectionHeading(doc, 'Parts institutionnelles', y + 4);
    y += 4;

    const headers = ['Entité', 'Principal (XAF)', 'Intérêts (XAF)', 'Total distribué (XAF)'];
    const widths  = [70, 38, 38, 36];
    const align: ('left' | 'right')[] = ['left', 'right', 'right', 'right'];

    const rows = record.participantShares.map((p) => [
      p.participantType,
      parseFloat(p.principalAmount).toLocaleString('fr-FR'),
      parseFloat(p.interestEarned).toLocaleString('fr-FR'),
      parseFloat(p.totalDistributed).toLocaleString('fr-FR'),
    ]);

    simpleTable(doc, headers, rows, widths, y, undefined, align);
  }

  addFooters(doc, 2);
  doc.save(`cassation_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

// ── Export Rapport Global Exercice Fiscal ─────────────────────────────────────

export function exportFiscalYearToPdf(
  fy: FiscalYear,
  sessions: MonthlySession[],
  savings: SavingsLedger[],
  loans: LoanAccount[],
  beneficiaries: BeneficiarySchedule | undefined,
  memberships: Membership[],
  memberMap: Record<string, string>,
) {
  const doc = new jsPDF();
  const fyLabel = fy.label;
  const pageH = () => doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();

  // ── Stats couverture ──
  const totalSavingsBalance = savings.reduce((s, l) => s + parseFloat(l.balance), 0);
  const totalLoansOutstanding = loans.reduce((s, l) => s + parseFloat(l.outstandingBalance), 0);
  const activeLoans = loans.filter((l) => ['ACTIVE', 'PARTIALLY_REPAID'].includes(l.status)).length;
  const slots = beneficiaries?.slots ?? [];
  const deliveredSlots = slots.filter((s) => s.status === 'DELIVERED').length;
  const grandTotal = sessions.reduce((s, sess) =>
    s + [sess.totalCotisation, sess.totalPot, sess.totalInscription, sess.totalSecours,
      sess.totalRbtPrincipal, sess.totalRbtInterest, sess.totalEpargne, sess.totalProjet, sess.totalAutres]
      .reduce((a, v) => a + parseFloat(v || '0'), 0), 0);

  coverPage(doc, 'Rapport Global Exercice Fiscal', fyLabel, [
    { label: 'Membres inscrits',      value: `${memberships.length}` },
    { label: 'Sessions tenues',       value: `${sessions.length}` },
    { label: 'Total collecté',        value: fmtXAF(grandTotal) },
    { label: 'Épargne cumulée',       value: fmtXAF(totalSavingsBalance) },
    { label: 'Encours prêts',         value: fmtXAF(totalLoansOutstanding) },
    { label: 'Bénéficiaires livrés',  value: `${deliveredSlots} / ${slots.length}` },
  ]);

  // ── Page 2 : Fiche exercice + Membres ──
  doc.addPage();
  pageHeader(doc, 'Informations Exercice', fyLabel);
  let y = 28;

  const FY_STATUS: Record<string, string> = {
    PENDING: 'En attente', ACTIVE: 'Actif', CASSATION: 'Cassation', CLOSED: 'Clôturé', ARCHIVED: 'Archivé',
  };

  y = sectionHeading(doc, 'Paramètres de l\'exercice', y + 4);
  y += 4;
  y = simpleTable(doc, ['Paramètre', 'Valeur'], [
    ['Libellé',           fyLabel],
    ['Statut',            FY_STATUS[fy.status] ?? fy.status],
    ['Début',             fmtDate(fy.startDate)],
    ['Fin',               fmtDate(fy.endDate)],
    ['Date de cassation', fmtDate(fy.cassationDate)],
    ['Échéance prêts',    fmtDate(fy.loanDueDate)],
    ['Notes',             fy.notes ?? '—'],
  ], [70, 112], y, undefined, ['left', 'left']);

  y += 8;
  if (y > pageH() - 40) { doc.addPage(); pageHeader(doc, 'Membres', fyLabel); y = 28; }
  y = sectionHeading(doc, `Membres inscrits (${memberships.length})`, y + 4);
  y += 4;

  const memberRows = memberships.map((m) => [
    m.profile ? `${m.profile.lastName} ${m.profile.firstName}` : m.id.slice(-8),
    m.profile?.memberCode ?? '—',
    m.shareCommitment?.sharesCount ?? '—',
    fmtDate(m.joinedAt),
    STATUS_FR[m.status] ?? m.status,
  ]);
  simpleTable(doc, ['Membre', 'Matricule', 'Parts', 'Inscrit le', 'Statut'],
    memberRows, [60, 26, 16, 28, 22], y, undefined, ['left', 'left', 'right', 'left', 'left']);

  // ── Page 3 : Sessions ──
  if (sessions.length > 0) {
    doc.addPage();
    pageHeader(doc, 'Synthèse des Sessions', fyLabel);
    y = 28;

    const chartData = sessions.map((s) => ({
      label: `S${s.sessionNumber}`,
      value: [s.totalCotisation, s.totalPot, s.totalInscription, s.totalSecours,
        s.totalRbtPrincipal, s.totalRbtInterest, s.totalEpargne, s.totalProjet, s.totalAutres]
        .reduce((a, v) => a + parseFloat(v || '0'), 0),
    }));

    drawBarChart(doc, chartData, 14, y + 10, pageW - 28, 44, 'Total collecté par session (XAF)');
    y += 62;

    y = sectionHeading(doc, 'Détail des sessions', y + 4);
    y += 4;

    const sessionRows = sessions.map((s) => {
      const total = chartData.find((d) => d.label === `S${s.sessionNumber}`)?.value ?? 0;
      return [
        `#${s.sessionNumber}`,
        fmtDate(s.meetingDate),
        STATUS_FR[s.status] ?? s.status,
        parseFloat(s.totalCotisation  || '0').toLocaleString('fr-FR'),
        parseFloat(s.totalEpargne     || '0').toLocaleString('fr-FR'),
        parseFloat(s.totalPot         || '0').toLocaleString('fr-FR'),
        (parseFloat(s.totalRbtPrincipal || '0') + parseFloat(s.totalRbtInterest || '0')).toLocaleString('fr-FR'),
        total.toLocaleString('fr-FR'),
      ];
    });

    const sum = (f: keyof MonthlySession) => sessions.reduce((s, sess) => s + parseFloat((sess[f] as string) || '0'), 0);
    const sessionTotals = [
      `Total (${sessions.length})`, '', '',
      sum('totalCotisation').toLocaleString('fr-FR'),
      sum('totalEpargne').toLocaleString('fr-FR'),
      sum('totalPot').toLocaleString('fr-FR'),
      (sum('totalRbtPrincipal') + sum('totalRbtInterest')).toLocaleString('fr-FR'),
      grandTotal.toLocaleString('fr-FR'),
    ];

    simpleTable(doc,
      ['Session', 'Date', 'Statut', 'Cotisations', 'Épargne', 'Pot', 'Remboursements', 'Total'],
      sessionRows, [18, 24, 20, 26, 22, 20, 30, 28], y, sessionTotals,
      ['left', 'left', 'left', 'right', 'right', 'right', 'right', 'right']);
  }

  // ── Page 4 : Épargne ──
  if (savings.length > 0) {
    doc.addPage();
    pageHeader(doc, 'Synthèse Épargne', fyLabel);
    y = 28;

    const totalPrincipal = savings.reduce((s, l) => s + parseFloat(l.principalBalance), 0);
    const totalInterest  = savings.reduce((s, l) => s + parseFloat(l.totalInterestReceived), 0);

    y = sectionHeading(doc, `Épargne par membre (${savings.length})`, y + 4);
    y += 4;
    simpleTable(doc, ['Membre', 'Solde (XAF)', 'Capital (XAF)', 'Intérêts (XAF)'],
      savings.map((l) => [
        memberMap[l.membershipId] ?? l.membershipId.slice(-8),
        parseFloat(l.balance).toLocaleString('fr-FR'),
        parseFloat(l.principalBalance).toLocaleString('fr-FR'),
        parseFloat(l.totalInterestReceived).toLocaleString('fr-FR'),
      ]),
      [70, 40, 40, 38], y,
      [`Total (${savings.length})`, totalSavingsBalance.toLocaleString('fr-FR'), totalPrincipal.toLocaleString('fr-FR'), totalInterest.toLocaleString('fr-FR')],
      ['left', 'right', 'right', 'right']);
  }

  // ── Page 5 : Prêts ──
  if (loans.length > 0) {
    doc.addPage();
    pageHeader(doc, 'Synthèse Prêts', fyLabel);
    y = 28;

    const LOAN_STATUS: Record<string, string> = {
      PENDING: 'En attente', ACTIVE: 'En cours', PARTIALLY_REPAID: 'Partiel', CLOSED: 'Clôturé',
    };

    y = sectionHeading(doc, `Prêts (${loans.length}) — ${activeLoans} actif${activeLoans > 1 ? 's' : ''}`, y + 4);
    y += 4;

    const totalRepaid = loans.reduce((s, l) => s + parseFloat(l.totalRepaid), 0);

    simpleTable(doc,
      ['Membre', 'Encours (XAF)', 'Remboursé (XAF)', 'Taux/mois', 'Statut', 'Échéance'],
      loans.map((l) => [
        memberMap[l.membershipId] ?? l.membershipId.slice(-8),
        parseFloat(l.outstandingBalance).toLocaleString('fr-FR'),
        parseFloat(l.totalRepaid).toLocaleString('fr-FR'),
        `${(parseFloat(l.monthlyRate) * 100).toFixed(1)}%`,
        LOAN_STATUS[l.status] ?? l.status,
        l.dueBeforeDate ? fmtDate(l.dueBeforeDate) : '—',
      ]),
      [52, 34, 34, 20, 22, 26], y,
      [`Total (${loans.length})`, totalLoansOutstanding.toLocaleString('fr-FR'), totalRepaid.toLocaleString('fr-FR'), '', '', ''],
      ['left', 'right', 'right', 'right', 'left', 'left']);
  }

  // ── Page 6 : Bénéficiaires ──
  if (slots.length > 0) {
    doc.addPage();
    pageHeader(doc, 'Tableau des Bénéficiaires', fyLabel);
    y = 28;

    const totalDelivered = slots.filter((s) => s.status === 'DELIVERED')
      .reduce((sum, s) => sum + parseFloat(s.amountDelivered || '0'), 0);

    y = sectionHeading(doc, `Slots bénéficiaires (${slots.length})`, y + 4);
    y += 4;

    simpleTable(doc,
      ['Mois', 'Slot', 'Bénéficiaire', 'Code', 'Montant (XAF)', 'Hôte', 'Statut'],
      slots.map((s) => [
        `M${s.month}`,
        `#${s.slotIndex}`,
        s.membership?.profile ? `${s.membership.profile.lastName} ${s.membership.profile.firstName}` : '—',
        s.membership?.profile?.memberCode ?? '—',
        parseFloat(s.amountDelivered || '0').toLocaleString('fr-FR'),
        s.isHost ? 'Oui' : '',
        STATUS_FR[s.status] ?? s.status,
      ]),
      [14, 14, 58, 24, 34, 14, 28], y,
      ['', `${deliveredSlots} livrés`, '', '', totalDelivered.toLocaleString('fr-FR'), '', ''],
      ['left', 'left', 'left', 'left', 'right', 'left', 'left']);
  }

  addFooters(doc, 2);
  doc.save(`exercice_global_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}
