'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Check } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useFiscalYearSavings } from '@lib/hooks/useSavings';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import {
  exportSavingsToExcel, exportSessionsToExcel, exportBeneficiariesToExcel,
} from '@lib/export/exportExcel';
import {
  exportSavingsToPdf, exportSessionsToPdf, exportBeneficiariesToPdf,
} from '@lib/export/exportPdf';

type ReportType = 'savings' | 'sessions' | 'beneficiaries';

const REPORT_CONFIG: Record<ReportType, { label: string; desc: string; color: string }> = {
  savings:       { label: 'Épargnes',       desc: 'Solde, capital et intérêts par membre',         color: 'emerald' },
  sessions:      { label: 'Sessions',       desc: 'Totaux collectés par session (12 mois)',         color: 'blue' },
  beneficiaries: { label: 'Bénéficiaires',  desc: 'Tableau de rotation, désignations et livraisons', color: 'violet' },
};

export default function ReportsPage() {
  const { selectedFyId, selectedFy, fiscalYears, setSelectedFyId } = useFiscalYearContext();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: savingsData }       = useFiscalYearSavings(selectedFyId);
  const { data: sessionsData }      = useSessionsByFiscalYear(selectedFyId);
  const { data: beneficiariesData } = useBeneficiarySchedule(selectedFyId);

  const fyLabel = selectedFy?.label ?? 'export';

  const handleExport = async (type: ReportType, format: 'excel' | 'pdf') => {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      if (type === 'savings') {
        if (!savingsData?.length) return alert('Aucune donnée d\'épargne disponible.');
        if (format === 'excel') { exportSavingsToExcel(savingsData, fyLabel); } else { exportSavingsToPdf(savingsData, fyLabel); }
      } else if (type === 'sessions') {
        if (!sessionsData?.length) return alert('Aucune session disponible.');
        if (format === 'excel') { exportSessionsToExcel(sessionsData, fyLabel); } else { exportSessionsToPdf(sessionsData, fyLabel); }
      } else if (type === 'beneficiaries') {
        if (!beneficiariesData) return alert('Aucun tableau de bénéficiaires disponible.');
        if (format === 'excel') { exportBeneficiariesToExcel(beneficiariesData, fyLabel); } else { exportBeneficiariesToPdf(beneficiariesData, fyLabel); }
      }
    } finally {
      setLoading(null);
    }
  };

  const dataAvailability: Record<ReportType, boolean> = {
    savings:       (savingsData?.length ?? 0) > 0,
    sessions:      (sessionsData?.length ?? 0) > 0,
    beneficiaries: (beneficiariesData?.slots?.length ?? 0) > 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rapports et exports"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Rapports' }]}
      />

      {/* Sélecteur d'exercice */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Exercice fiscal cible
        </label>
        <select
          value={selectedFyId}
          onChange={(e) => setSelectedFyId(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-xs"
        >
          {fiscalYears?.map((fy) => (
            <option key={fy.id} value={fy.id}>
              {fy.label} — {fy.status}
            </option>
          ))}
        </select>
        {selectedFy && (
          <p className="text-xs text-gray-400 mt-1.5">
            {new Date(selectedFy.startDate).toLocaleDateString('fr-FR')} →{' '}
            {new Date(selectedFy.endDate).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Cards d'export */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(REPORT_CONFIG) as ReportType[]).map((type) => {
          const cfg = REPORT_CONFIG[type];
          const available = dataAvailability[type];

          return (
            <div key={type} className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl bg-${cfg.color}-50 shrink-0`}>
                  <Download className={`h-5 w-5 text-${cfg.color}-600`} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{cfg.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
                </div>
              </div>

              {/* Disponibilité des données */}
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                {available ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5 h-3.5" />}
                {available ? 'Données disponibles' : 'Aucune donnée pour cet exercice'}
              </div>

              <div className="flex gap-2 mt-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-1.5"
                  isLoading={loading === `${type}-excel`}
                  onClick={() => handleExport(type, 'excel')}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Excel
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-1.5"
                  isLoading={loading === `${type}-pdf`}
                  onClick={() => handleExport(type, 'pdf')}
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        Les exports contiennent toutes les données de l'exercice sélectionné. Les fichiers sont générés directement dans votre navigateur — aucune donnée n'est envoyée vers un serveur externe.
      </div>
    </div>
  );
}
