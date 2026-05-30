'use client';

import { useState, useRef, useCallback, DragEvent } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  CalendarDays,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Briefcase,
  X,
  ArrowRight,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parseCAYABASE, type ParseResult } from '@lib/import/parseCAYABASE';
import { reportsApi } from '@lib/api/reports.api';

/* ─── Étapes du wizard ──────────────────────────────────────────── */
type Step = 'idle' | 'parsing' | 'preview' | 'importing' | 'done';

/* ─── Stat card ─────────────────────────────────────────────────── */
interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ item }: { item: StatItem }) {
  return (
    <div className={`rounded-xl p-4 border ${item.color} flex items-center gap-3`}>
      <div className="shrink-0">{item.icon}</div>
      <div>
        <p className="text-xs text-slate-500 leading-none mb-1">{item.label}</p>
        <p className="text-xl font-bold text-slate-900">{item.value}</p>
      </div>
    </div>
  );
}

/* ─── Composant principal ───────────────────────────────────────── */
export default function ImportCAYABASE() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('idle');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [importLabel, setImportLabel] = useState('');
  const [showMemberList, setShowMemberList] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keepOpen, setKeepOpen] = useState(false);
  const [doneInfo, setDoneInfo] = useState<{ status: 'ACTIVE' | 'CLOSED'; openMonth: number | null } | null>(null);

  /* ── Parsing ── */
  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      toast.error('Format invalide — veuillez choisir un fichier .xlsx');
      return;
    }
    setStep('parsing');
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = await parseCAYABASE(buffer);
      setParsed(result);
      setImportLabel(result.data.label);
      // Suggestion : si l'exercice n'est pas terminé (fin dans le futur), proposer "en cours".
      setKeepOpen(new Date(result.data.endDate).getTime() > Date.now());
      setStep('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier Excel.';
      setErrorMsg(msg);
      setStep('idle');
      toast.error(msg, { duration: 6000 });
    }
  }, []);

  /* ── Drag & Drop ── */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = () => setIsDraggingOver(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  /* ── Import confirm ── */
  const handleConfirmImport = async () => {
    if (!parsed) return;
    if (!importLabel.trim()) {
      toast.error("Le nom de l'exercice est obligatoire.");
      return;
    }
    setStep('importing');
    try {
      const payload = { ...parsed.data, label: importLabel.trim(), keepOpen };
      const result = await reportsApi.importFiscalYear(payload);
      setDoneInfo({ status: result.status, openMonth: result.openMonth });
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      const modeMsg =
        result.status === 'ACTIVE'
          ? `▶️ Exercice EN COURS${result.openMonth ? ` — reprise à la session #${result.openMonth}` : ''}`
          : '📦 Exercice archivé (clôturé)';
      toast.success(
        `✅ "${importLabel}" importé ! ${result.membersMatched} membres trouvés, ${result.membersCreated} créés. ${modeMsg}`,
        { duration: 8000 },
      );
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] }; status?: number } };
      const raw = axiosErr.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw.join(' | ')
        : raw ?? `Erreur ${axiosErr.response?.status ?? ''} lors de l'import.`;
      toast.error(msg, { duration: 8000 });
      setStep('preview');
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    setStep('idle');
    setParsed(null);
    setImportLabel('');
    setErrorMsg(null);
    setShowMemberList(false);
    setKeepOpen(false);
    setDoneInfo(null);
  };

  /* ──────────────────────────────── RENDER ──────────────────────── */

  /* État DONE */
  if (step === 'done') {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-primary-50 p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-emerald-900">Import réussi !</h3>
          <p className="text-sm text-emerald-700 mt-1">
            L&apos;exercice <strong>&quot;{importLabel}&quot;</strong> est disponible avec le statut{' '}
            <span className="font-semibold">{doneInfo?.status === 'ACTIVE' ? 'Actif (en cours)' : 'Clôturé'}</span>.
            {doneInfo?.status === 'ACTIVE' && doneInfo.openMonth ? (
              <> La saisie reprend à la <strong>session #{doneInfo.openMonth}</strong>.</>
            ) : null}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="mt-2 text-sm text-emerald-600 underline underline-offset-2 hover:text-emerald-800 transition-colors"
        >
          Importer un autre exercice
        </button>
      </div>
    );
  }

  /* État PREVIEW */
  if ((step === 'preview' || step === 'importing') && parsed) {
    const d = parsed.data;
    const stats: StatItem[] = [
      {
        label: 'Membres détectés',
        value: d.members.length,
        icon: <Users className="h-5 w-5 text-primary-500" />,
        color: 'bg-primary-50 border-primary-100',
      },
      {
        label: 'Sessions mensuelles',
        value: `${d.sessions.length} / 12`,
        icon: <CalendarDays className="h-5 w-5 text-primary-500" />,
        color: 'bg-primary-50 border-primary-100',
      },
      {
        label: 'Prêts identifiés',
        value: d.loans.length,
        icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
        color: 'bg-amber-50 border-amber-100',
      },
      {
        label: 'Épargnes',
        value: d.savings.length,
        icon: <Landmark className="h-5 w-5 text-emerald-500" />,
        color: 'bg-emerald-50 border-emerald-100',
      },
      {
        label: 'Caisse de secours',
        value: d.rescueFund.length,
        icon: <ShieldCheck className="h-5 w-5 text-red-500" />,
        color: 'bg-red-50 border-red-100',
      },
      {
        label: 'Comptes spéciaux',
        value: (d.specialAccounts ?? []).length,
        icon: <Briefcase className="h-5 w-5 text-slate-500" />,
        color: 'bg-slate-50 border-slate-100',
      },
    ];

    const startFmt = new Date(d.startDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const endFmt = new Date(d.endDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    return (
      <div className="rounded-2xl border-2 border-primary-200 bg-gradient-to-br from-primary-50/60 to-primary-50/60 p-6 space-y-5">

        {/* Header prévisualisation */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-primary-900">Prévisualisation de l&apos;import</h3>
              <p className="text-xs text-primary-600">{startFmt} → {endFmt}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={step === 'importing'}
            className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-400 hover:text-primary-700 transition-colors disabled:opacity-40"
            title="Annuler"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nom de l'exercice */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nom de l&apos;exercice <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={importLabel}
            onChange={(e) => setImportLabel(e.target.value)}
            disabled={step === 'importing'}
            placeholder="Ex : 2024-2025"
            className="w-full max-w-xs rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm font-mono font-semibold text-primary-900 shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition
                       disabled:opacity-60"
          />
          <p className="text-xs text-primary-400 mt-1">Détecté automatiquement depuis le fichier. Modifiable si besoin.</p>
        </div>

        {/* Type d'import : archivé vs en cours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d&apos;import</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setKeepOpen(false)}
              disabled={step === 'importing'}
              className={`text-left rounded-xl border p-3 transition-all disabled:opacity-60 ${!keepOpen ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <p className="text-sm font-semibold text-gray-800">📦 Exercice terminé</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Archivé en statut <strong>Clôturé</strong>. Pour conserver l&apos;historique d&apos;un exercice bouclé.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setKeepOpen(true)}
              disabled={step === 'importing'}
              className={`text-left rounded-xl border p-3 transition-all disabled:opacity-60 ${keepOpen ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <p className="text-sm font-semibold text-gray-800">▶️ Exercice en cours</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Statut <strong>Actif</strong>. Reprend la saisie au mois suivant le dernier saisi.
              </p>
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <StatCard key={s.label} item={s} />
          ))}
        </div>

        {/* Liste des membres (collapsible) */}
        <div className="rounded-xl border border-primary-100 bg-white overflow-hidden">
          <button
            onClick={() => setShowMemberList((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary-500" />
              Membres détectés ({d.members.length})
            </span>
            {showMemberList ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showMemberList && (
            <div className="border-t border-primary-50 px-4 py-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {d.members.map((name, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5">
                    <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Erreurs critiques */}
        {parsed.criticalErrors && parsed.criticalErrors.length > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-800">Erreurs bloquantes ({parsed.criticalErrors.length})</p>
            </div>
            <p className="text-xs text-red-600 mb-3">Ces erreurs doivent être corrigées dans le fichier Excel avant de pouvoir importer.</p>
            <ul className="space-y-1">
              {parsed.criticalErrors.map((w, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avertissements */}
        {parsed.warnings.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm font-semibold text-amber-800">Avertissements de parsing ({parsed.warnings.length})</p>
            </div>
            <ul className="space-y-1">
              {parsed.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Note informative */}
        <div className="flex items-start gap-2.5 text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Les membres non trouvés dans la base seront <strong>créés automatiquement</strong> avec un compte provisoire.
            L&apos;exercice sera importé avec le statut <strong>Clôturé</strong> et le badge <strong>Importé</strong>.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={handleReset}
            disabled={step === 'importing'}
            className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={step === 'importing' || !importLabel.trim() || (parsed.criticalErrors && parsed.criticalErrors.length > 0)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg
                       bg-gradient-to-r from-primary-600 to-primary-600
                       hover:from-primary-700 hover:to-primary-700
                       shadow-md shadow-primary-200
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'importing' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Import en cours…
              </>
            ) : (
              <>
                Confirmer l&apos;import
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* État IDLE / PARSING */
  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => step === 'idle' && fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
          flex flex-col items-center justify-center text-center p-10 gap-4 select-none
          ${isDraggingOver
            ? 'border-primary-500 bg-primary-50 scale-[1.01] shadow-lg shadow-primary-100'
            : 'border-emerald-300 bg-gradient-to-br from-emerald-50/60 to-primary-50/60 hover:border-emerald-400 hover:bg-emerald-50'
          }
          ${step === 'parsing' ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />

        {step === 'parsing' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-primary-800 text-base">Lecture du fichier…</p>
              <p className="text-sm text-primary-500 mt-1">Analyse des feuilles Excel en cours</p>
            </div>
          </>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-200 ${isDraggingOver ? 'bg-primary-100 scale-110' : 'bg-emerald-100'}`}>
              {isDraggingOver
                ? <ArrowRight className="h-8 w-8 text-primary-600 rotate-90" />
                : <Upload className="h-8 w-8 text-emerald-600" strokeWidth={1.5} />
              }
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">
                {isDraggingOver ? 'Relâchez pour importer' : 'Glissez votre fichier CAYABASE ici'}
              </p>
              <p className="text-sm text-slate-500 mt-1">ou cliquez pour parcourir vos fichiers</p>
              <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-100 rounded-full px-3 py-0.5 inline-block">.xlsx uniquement</p>
            </div>
          </>
        )}
      </div>

      {/* Message d'erreur */}
      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Erreur de lecture</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Checklist des feuilles attendues */}
      <div className="rounded-xl bg-white border border-slate-200 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Feuilles attendues dans le fichier CAYABASE
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { name: 'ep+int', desc: 'Épargne + intérêts', required: true },
            { name: 'prets', desc: 'Prêts accordés', required: false },
            { name: 'Rem', desc: 'Remboursements', required: false },
            { name: 'intérêts', desc: 'Intérêts sur prêts', required: false },
            { name: 'insc+sec', desc: 'Inscription + Secours', required: true },
            { name: 'Oct.25 …', desc: 'Feuilles session mensuelle', required: false },
          ].map((sheet) => (
            <div key={sheet.name} className="flex items-start gap-2 text-xs p-2.5 rounded-lg bg-slate-50">
              <span className={`mt-0.5 font-bold ${sheet.required ? 'text-emerald-600' : 'text-slate-400'}`}>
                {sheet.required ? '✓' : '○'}
              </span>
              <div>
                <p className={`font-mono font-semibold ${sheet.required ? 'text-slate-800' : 'text-slate-500'}`}>{sheet.name}</p>
                <p className="text-slate-400">{sheet.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          <span className="text-emerald-600 font-semibold">✓ Obligatoire</span> — les autres feuilles enrichissent l&apos;import mais ne sont pas bloquantes.
        </p>
      </div>
    </div>
  );
}
