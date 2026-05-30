'use client';

import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Check, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useFiscalYearSavings } from '@lib/hooks/useSavings';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import { useFiscalYearMemberships, useFiscalYear } from '@lib/hooks/useFiscalYear';
import { useFiscalYearLoans } from '@lib/hooks/useLoans';
import { useCassation } from '@lib/hooks/useCassation';
import {
  exportSavingsToExcel, exportSessionsToExcel, exportBeneficiariesToExcel,
  exportFiscalYearToExcel,
} from '@lib/export/exportExcel';
import { reportsApi } from '@lib/api/reports.api';
import {
  exportSavingsToPdf, exportSessionsToPdf, exportBeneficiariesToPdf,
  exportCassationToPdf, exportFiscalYearToPdf,
} from '@lib/export/exportPdf';
import ImportCAYABASE from '@components/forms/ImportCAYABASE';

type ReportType = 'savings' | 'sessions' | 'beneficiaries' | 'cassation' | 'fiscal-year';

const REPORT_CONFIG: Record<ReportType, { label: string; desc: string; color: string; pdfOnly?: boolean }> = {
  savings:      { label: 'Épargnes',              desc: 'Solde, capital et intérêts par membre',              color: 'emerald' },
  sessions:     { label: 'Sessions',              desc: 'Totaux collectés par session (12 mois)',              color: 'blue' },
  beneficiaries:{ label: 'Bénéficiaires',         desc: 'Tableau de rotation, désignations et livraisons',    color: 'violet' },
  cassation:    { label: 'Cassation',             desc: 'Redistributions membres + parts institutionnelles',  color: 'orange', pdfOnly: true },
  'fiscal-year':{ label: 'Exercice fiscal global',desc: 'Synthèse complète : membres, sessions, épargne, prêts, bénéficiaires', color: 'indigo', pdfOnly: true },
};

export default function ReportsPage() {
  const { selectedFyId, selectedFy, fiscalYears, setSelectedFyId } = useFiscalYearContext();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: savingsData }       = useFiscalYearSavings(selectedFyId);
  const { data: sessionsData }      = useSessionsByFiscalYear(selectedFyId);
  const { data: beneficiariesData } = useBeneficiarySchedule(selectedFyId);
  const { data: memberships }       = useFiscalYearMemberships(selectedFyId);
  const { data: loansData }         = useFiscalYearLoans(selectedFyId);
  const { data: fyDetail }          = useFiscalYear(selectedFyId);
  const { data: cassationRecord }   = useCassation(selectedFyId);

  const fyLabel = selectedFy?.label ?? 'export';

  // Map membershipId → "Nom Prénom" pour les exports
  const memberMap: Record<string, string> = {};
  (memberships ?? []).forEach((m) => {
    if (m.profile) {
      memberMap[m.id] = `${m.profile.lastName} ${m.profile.firstName}`;
    }
  });

  const handleExport = async (type: ReportType, format: 'excel' | 'pdf') => {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      if (type === 'savings') {
        if (!savingsData?.length) return alert('Aucune donnée d\'épargne disponible.');
        if (format === 'excel') { await exportSavingsToExcel(savingsData, fyLabel); } else { exportSavingsToPdf(savingsData, fyLabel, memberMap); }
      } else if (type === 'sessions') {
        if (!sessionsData?.length) return alert('Aucune session disponible.');
        if (format === 'excel') {
          await exportSessionsToExcel(sessionsData, fyLabel);
        } else {
          exportSessionsToPdf(
            sessionsData,
            fyLabel,
            memberMap,
            beneficiariesData ?? undefined,
            savingsData ?? undefined,
            loansData ?? undefined
          );
        }
      } else if (type === 'beneficiaries') {
        if (!beneficiariesData) return alert('Aucun tableau de bénéficiaires disponible.');
        if (format === 'excel') { await exportBeneficiariesToExcel(beneficiariesData, fyLabel); } else { exportBeneficiariesToPdf(beneficiariesData, fyLabel); }
      } else if (type === 'cassation') {
        if (!cassationRecord) return alert('Aucune cassation exécutée pour cet exercice.');
        exportCassationToPdf(cassationRecord, fyLabel);
      } else if (type === 'fiscal-year') {
        if (!fyDetail) return alert('Données de l\'exercice non disponibles.');
        exportFiscalYearToPdf(
          fyDetail,
          sessionsData ?? [],
          savingsData ?? [],
          loansData ?? [],
          beneficiariesData ?? undefined,
          memberships ?? [],
          memberMap,
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleExportCAYABASE = async () => {
    if (!selectedFyId) return alert('Veuillez sélectionner un exercice fiscal.');
    setLoading('cayabase');
    try {
      const data = await reportsApi.getFullFiscalYearData(selectedFyId);
      await exportFiscalYearToExcel(data, fyLabel);
    } catch (err) {
      alert('Erreur lors de la génération du fichier CAYABASE. Vérifiez votre connexion.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const dataAvailability: Record<ReportType, boolean> = {
    savings:        (savingsData?.length ?? 0) > 0,
    sessions:       (sessionsData?.length ?? 0) > 0,
    beneficiaries:  (beneficiariesData?.slots?.length ?? 0) > 0,
    cassation:      !!cassationRecord,
    'fiscal-year':  !!fyDetail && (memberships?.length ?? 0) > 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rapports et exports"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Rapports' }]}
      />

      {/* Sélecteur d'exercice */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Exercice fiscal cible
        </label>
        <Select
          value={selectedFyId}
          onChange={(e) => setSelectedFyId(e.target.value)}
          className="w-full max-w-xs"
        >
          {fiscalYears?.map((fy) => (
            <option key={fy.id} value={fy.id}>
              {fy.label} — {fy.status}
            </option>
          ))}
        </Select>
        {selectedFy && (
          <p className="text-xs text-slate-400 mt-1.5">
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
            <div key={type} className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl bg-${cfg.color}-50 shrink-0`}>
                  <Download className={`h-5 w-5 text-${cfg.color}-600`} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{cfg.label}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cfg.desc}</p>
                </div>
              </div>

              {/* Disponibilité des données */}
              <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                {available ? <Check className="h-3.5 w-3.5" /> : <span className="w-3.5 h-3.5" />}
                {available ? 'Données disponibles' : 'Aucune donnée pour cet exercice'}
              </div>

              <div className="flex gap-2 mt-auto">
                {!cfg.pdfOnly && (
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
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className={`flex items-center justify-center gap-1.5 ${cfg.pdfOnly ? 'flex-1' : ''}`}
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

      {/* Export CAYABASE complet */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-50 rounded-xl border-2 border-primary-200 shadow-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-100 shrink-0">
            <BookOpen className="h-6 w-6 text-primary-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-900">Export exercice complet — CAYABASE</h3>
            <p className="text-sm text-primary-600 mt-1">
              Génère un fichier Excel multi-feuilles au format CAYABASE : épargne + intérêts, prêts,
              remboursements, intérêts sur prêts, inscriptions + secours, et le détail de chaque session mensuelle.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="primary"
                className="flex items-center gap-2"
                isLoading={loading === 'cayabase'}
                onClick={handleExportCAYABASE}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exporter l&apos;exercice complet
              </Button>
              {selectedFy && (
                <span className="text-xs text-primary-500">
                  {selectedFy.label} — {(memberships?.length ?? 0)} membres inscrits
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import CAYABASE — composant dédié */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-bold text-slate-800">Importer un exercice depuis l&apos;historique papier</h2>
        </div>
        <ImportCAYABASE />
      </div>

      <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-700">
        Les exports contiennent toutes les données de l&apos;exercice sélectionné. Les fichiers sont générés directement dans votre navigateur — aucune donnée n&apos;est envoyée vers un serveur externe.
      </div>
    </div>
  );
}
