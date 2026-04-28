'use client';

import { useState, useRef } from 'react';
import { FileSpreadsheet, FileText, Download, Check, BookOpen, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import Modal from '@components/ui/Modal';
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
import { parseCAYABASE, type ImportFiscalYearDto, type ParseResult } from '@lib/import/parseCAYABASE';

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
  const queryClient = useQueryClient();

  // ── Import state ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importParsed, setImportParsed] = useState<ParseResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importLabel, setImportLabel] = useState('');

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset input

    setImportLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseCAYABASE(buffer);
      setImportParsed(result);
      setImportLabel(result.data.label);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la lecture du fichier Excel.');
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importParsed) return;
    if (!importLabel.trim()) return toast.error('Le nom de l\'exercice est obligatoire.');
    setImportLoading(true);
    try {
      const payload = { ...importParsed.data, label: importLabel.trim() };
      const result = await reportsApi.importFiscalYear(payload);
      toast.success(
        `Exercice "${importLabel}" importé ! ${result.membersMatched} membres trouvés, ${result.membersCreated} créés.`,
      );
      setImportParsed(null);
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'import.';
      toast.error(msg);
      console.error(err);
    } finally {
      setImportLoading(false);
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
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
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
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border-2 border-indigo-200 shadow-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-100 shrink-0">
            <BookOpen className="h-6 w-6 text-indigo-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-indigo-900">Export exercice complet — CAYABASE</h3>
            <p className="text-sm text-indigo-600 mt-1">
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
                <span className="text-xs text-indigo-500">
                  {selectedFy.label} — {(memberships?.length ?? 0)} membres inscrits
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Import CAYABASE */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 shadow-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 shrink-0">
            <Upload className="h-6 w-6 text-emerald-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-emerald-900">Importer un exercice — CAYABASE</h3>
            <p className="text-sm text-emerald-600 mt-1">
              Importez un fichier Excel au format CAYABASE pour recréer un exercice fiscal complet dans l&apos;application.
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Le fichier doit contenir les feuilles : <strong>ep+int</strong>, <strong>prets</strong>, <strong>Rem</strong>, <strong>intérêts</strong>, <strong>insc+sec</strong>, et au moins une feuille session (ex: Oct.25)</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Les membres non trouvés dans la base seront <strong>créés automatiquement</strong> avec un compte par défaut</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>L&apos;exercice sera créé avec le statut <strong>Clôturé</strong> et le badge <strong>Importé</strong></span>
              </div>
              <div className="flex items-start gap-2 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Vous pourrez <strong>modifier le nom</strong> de l&apos;exercice avant de confirmer l&apos;import</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="primary"
                className="flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
                isLoading={importLoading && !importParsed}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Choisir un fichier .xlsx
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        Les exports contiennent toutes les données de l'exercice sélectionné. Les fichiers sont générés directement dans votre navigateur — aucune donnée n'est envoyée vers un serveur externe.
      </div>

      {/* Modal de confirmation d'import */}
      <Modal
        isOpen={Boolean(importParsed)}
        onClose={() => !importLoading && setImportParsed(null)}
        title="Confirmer l'import CAYABASE"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setImportParsed(null)}
              disabled={importLoading}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              className="!bg-emerald-600 hover:!bg-emerald-700"
              isLoading={importLoading}
              onClick={handleConfirmImport}
            >
              Confirmer l&apos;import
            </Button>
          </div>
        }
      >
        {importParsed && (
          <div className="space-y-4">
            {/* Nom de l'exercice — modifiable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;exercice
              </label>
              <input
                type="text"
                value={importLabel}
                onChange={(e) => setImportLabel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ex : 2024-2025"
              />
              <p className="text-xs text-gray-400 mt-1">
                Nom détecté automatiquement. Modifiez-le si nécessaire.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Période</p>
                <p className="font-semibold text-gray-900">
                  {new Date(importParsed.data.startDate).toLocaleDateString('fr-FR')} →{' '}
                  {new Date(importParsed.data.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Membres détectés</p>
                <p className="font-semibold text-gray-900">{importParsed.data.members.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Sessions</p>
                <p className="font-semibold text-gray-900">{importParsed.data.sessions.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Prêts détectés</p>
                <p className="font-semibold text-gray-900">{importParsed.data.loans.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Épargnes</p>
                <p className="font-semibold text-gray-900">{importParsed.data.savings.length}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Secours</p>
                <p className="font-semibold text-gray-900">{importParsed.data.rescueFund.length}</p>
              </div>
            </div>

            {importParsed.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 mb-1">Avertissements :</p>
                <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                  {importParsed.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Les membres non trouvés dans la base seront créés automatiquement.
              L&apos;exercice sera créé avec le statut « Clôturé » et le badge « Importé ».
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
