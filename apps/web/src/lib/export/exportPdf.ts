import jsPDF from 'jspdf';
import type { SavingsLedger, MonthlySession, BeneficiarySchedule, BeneficiarySlot, LoanAccount } from '@/types/api.types';

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
