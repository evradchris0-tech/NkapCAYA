import jsPDF from 'jspdf';
import type { SavingsLedger, MonthlySession, BeneficiarySchedule } from '@/types/api.types';

function header(doc: jsPDF, title: string, fyLabel: string) {
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CAYA', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(title, 60, 13);
  doc.text(fyLabel, 210 - 14, 13, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function tableRow(doc: jsPDF, y: number, cols: string[], widths: number[], x0 = 14) {
  let x = x0;
  cols.forEach((text, i) => {
    doc.text(String(text ?? '—'), x + 1, y);
    x += widths[i];
  });
}

function simpleTable(
  doc: jsPDF,
  headers: string[],
  rows: string[][],
  widths: number[],
  startY = 30,
) {
  const ROW_H = 7;
  let y = startY;

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y - 5, widths.reduce((a, b) => a + b, 0), ROW_H, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  tableRow(doc, y, headers, widths);
  y += ROW_H;

  doc.setFont('helvetica', 'normal');
  rows.forEach((row, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, widths.reduce((a, b) => a + b, 0), ROW_H, 'F');
    }
    tableRow(doc, y, row, widths);
    y += ROW_H;
  });
  return y;
}

export function exportSavingsToPdf(ledgers: SavingsLedger[], fyLabel: string) {
  const doc = new jsPDF();
  header(doc, 'Rapport Épargnes', fyLabel);

  const headers = ['Membership', 'Solde (XAF)', 'Capital (XAF)', 'Intérêts (XAF)'];
  const widths = [60, 45, 45, 45];
  const rows = ledgers.map((l) => [
    l.membershipId.slice(-8),
    parseFloat(l.balance).toLocaleString('fr-FR'),
    parseFloat(l.principalBalance).toLocaleString('fr-FR'),
    parseFloat(l.totalInterestReceived).toLocaleString('fr-FR'),
  ]);
  simpleTable(doc, headers, rows, widths);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 290);
  doc.save(`epargnes_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

export function exportSessionsToPdf(sessions: MonthlySession[], fyLabel: string) {
  const doc = new jsPDF({ orientation: 'landscape' });
  header(doc, 'Rapport Sessions', fyLabel);

  const headers = ['Session', 'Date', 'Statut', 'Cotisation', 'Épargne', 'Prêts', 'Total'];
  const widths = [22, 30, 26, 30, 26, 26, 30];
  const rows = sessions.map((s) => {
    const total = [s.totalCotisation, s.totalPot, s.totalInscription, s.totalSecours,
      s.totalRbtPrincipal, s.totalRbtInterest, s.totalEpargne, s.totalProjet, s.totalAutres]
      .reduce((sum, v) => sum + parseFloat(v || '0'), 0);
    return [
      `#${s.sessionNumber}`,
      new Date(s.meetingDate).toLocaleDateString('fr-FR'),
      s.status,
      parseFloat(s.totalCotisation || '0').toLocaleString('fr-FR'),
      parseFloat(s.totalEpargne || '0').toLocaleString('fr-FR'),
      (parseFloat(s.totalRbtPrincipal || '0') + parseFloat(s.totalRbtInterest || '0')).toLocaleString('fr-FR'),
      total.toLocaleString('fr-FR'),
    ];
  });
  simpleTable(doc, headers, rows, widths);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 200);
  doc.save(`sessions_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}

export function exportBeneficiariesToPdf(schedule: BeneficiarySchedule, fyLabel: string) {
  const doc = new jsPDF();
  header(doc, 'Tableau Bénéficiaires', fyLabel);

  const headers = ['Mois', 'Slot', 'Bénéficiaire', 'Code', 'Montant', 'Statut'];
  const widths = [16, 16, 60, 24, 36, 26];
  const rows = (schedule.slots ?? []).map((slot) => [
    `M${slot.month}`,
    `#${slot.slotIndex}`,
    slot.membership?.profile
      ? `${slot.membership.profile.lastName} ${slot.membership.profile.firstName}`
      : '—',
    slot.membership?.profile?.memberCode ?? '—',
    `${parseFloat(slot.amountDelivered).toLocaleString('fr-FR')} XAF`,
    slot.status,
  ]);
  simpleTable(doc, headers, rows, widths);

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 290);
  doc.save(`beneficiaires_${fyLabel.replace(/\s+/g, '_')}.pdf`);
}
