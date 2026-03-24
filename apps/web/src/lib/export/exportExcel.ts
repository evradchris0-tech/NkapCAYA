import * as XLSX from 'xlsx';
import type { SavingsLedger, MonthlySession, BeneficiarySchedule } from '@/types/api.types';

function autoWidth(ws: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  const cols: { wch: number }[] = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    let max = 10;
    for (let R = range.s.r; R <= range.e.r; R++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell?.v) max = Math.max(max, String(cell.v).length + 2);
    }
    cols.push({ wch: max });
  }
  ws['!cols'] = cols;
}

export function exportSavingsToExcel(ledgers: SavingsLedger[], fyLabel: string) {
  const rows = ledgers.map((l) => ({
    'Membership ID': l.membershipId,
    'Solde (XAF)': parseFloat(l.balance),
    'Capital versé (XAF)': parseFloat(l.principalBalance),
    'Intérêts reçus (XAF)': parseFloat(l.totalInterestReceived),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Épargnes');
  XLSX.writeFile(wb, `epargnes_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}

export function exportSessionsToExcel(sessions: MonthlySession[], fyLabel: string) {
  const rows = sessions.map((s) => ({
    'N° Session': s.sessionNumber,
    'Date réunion': new Date(s.meetingDate).toLocaleDateString('fr-FR'),
    'Statut': s.status,
    'Cotisation': parseFloat(s.totalCotisation || '0'),
    'Pot': parseFloat(s.totalPot || '0'),
    'Inscription': parseFloat(s.totalInscription || '0'),
    'Secours': parseFloat(s.totalSecours || '0'),
    'Rbt Principal': parseFloat(s.totalRbtPrincipal || '0'),
    'Rbt Intérêts': parseFloat(s.totalRbtInterest || '0'),
    'Épargne': parseFloat(s.totalEpargne || '0'),
    'Projet': parseFloat(s.totalProjet || '0'),
    'Autres': parseFloat(s.totalAutres || '0'),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
  XLSX.writeFile(wb, `sessions_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}

export function exportBeneficiariesToExcel(schedule: BeneficiarySchedule, fyLabel: string) {
  const rows = (schedule.slots ?? []).map((slot) => ({
    'Mois': `M${slot.month}`,
    'Slot': `#${slot.slotIndex}`,
    'Bénéficiaire': slot.membership?.profile
      ? `${slot.membership.profile.lastName} ${slot.membership.profile.firstName}`
      : '—',
    'Code': slot.membership?.profile?.memberCode ?? '—',
    'Montant (XAF)': parseFloat(slot.amountDelivered),
    'Statut': slot.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bénéficiaires');
  XLSX.writeFile(wb, `beneficiaires_${fyLabel.replace(/\s+/g, '_')}.xlsx`);
}
