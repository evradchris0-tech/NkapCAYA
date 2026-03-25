'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Users, ClipboardList, PiggyBank, Banknote, Gift,
  BarChart3, Gavel, Check, RotateCcw, ChevronRight, BookOpen,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';

interface Step {
  id: string;
  title: string;
  category: 'Démarrage' | 'Opérations' | 'Avancé';
  icon: LucideIcon;
  color: string;
  description: string;
  details: string[];
  href?: string;
  linkLabel?: string;
}

const STEPS: Step[] = [
  {
    id: 'create-fy',
    title: 'Créer un exercice fiscal',
    category: 'Démarrage',
    icon: Calendar,
    color: 'bg-violet-100 text-violet-700',
    description: "L'exercice fiscal est le cadre annuel de la tontine. Toutes les sessions, épargnes et prêts lui sont rattachés.",
    details: [
      "Allez dans « Exercices fiscaux » puis cliquez sur « Nouvel exercice ».",
      "Définissez les dates de début, fin, limite prêts et date de cassation.",
      "Une fois créé, l'exercice est en statut PENDING — il faut l'activer.",
      "Seul le Super Admin peut activer un exercice.",
    ],
    href: '/fiscal-year',
    linkLabel: 'Aller aux exercices',
  },
  {
    id: 'add-members',
    title: 'Inscrire les membres à l\'exercice',
    category: 'Démarrage',
    icon: Users,
    color: 'bg-blue-100 text-blue-700',
    description: "Chaque membre doit être inscrit à l'exercice actif pour participer aux sessions, épargner et emprunter.",
    details: [
      "Dans le détail d'un exercice, cliquez sur « + Inscrire un membre ».",
      "Choisissez le type d'inscription : Nouveau (première fois) ou Ré-inscription.",
      "Indiquez le nombre de parts engagées (peut être fractionnaire : 0.5, 1, 1.5…).",
      "La date d'inscription détermine à partir de quel mois les cotisations sont dues.",
    ],
    href: '/fiscal-year',
    linkLabel: 'Voir les exercices',
  },
  {
    id: 'open-session',
    title: 'Ouvrir une session mensuelle',
    category: 'Opérations',
    icon: ClipboardList,
    color: 'bg-emerald-100 text-emerald-700',
    description: "Chaque session correspond à une réunion mensuelle de la tontine. Elle suit un workflow strict : DRAFT → OPEN → REVIEWING → CLOSED.",
    details: [
      "Les 12 sessions sont automatiquement créées à l'activation de l'exercice.",
      "Le Trésorier ouvre la session en cliquant sur « Ouvrir la session ».",
      "En statut OPEN, les transactions peuvent être saisies.",
      "Une fois toutes les entrées saisies, le Trésorier soumet pour révision.",
      "Le Président valide et clôture la session — les intérêts sont distribués.",
    ],
    href: '/sessions',
    linkLabel: 'Voir les sessions',
  },
  {
    id: 'record-entries',
    title: 'Saisir les cotisations et transactions',
    category: 'Opérations',
    icon: PiggyBank,
    color: 'bg-amber-100 text-amber-700',
    description: "Durant une session OPEN, le Trésorier saisit toutes les transactions : cotisations, épargne, remboursements de prêts, etc.",
    details: [
      "Dans le détail d'une session OPEN, cliquez sur « + Transaction ».",
      "Sélectionnez le membre, le type de transaction et le montant.",
      "Types disponibles : Cotisation, Épargne, Remboursement Principal/Intérêts, Pot, Inscription, Secours, Projet, Autres.",
      "Toutes les transactions sont visibles dans le tableau de la session.",
    ],
    href: '/sessions',
    linkLabel: 'Aller aux sessions',
  },
  {
    id: 'loans',
    title: 'Gérer les prêts',
    category: 'Opérations',
    icon: Banknote,
    color: 'bg-rose-100 text-rose-700',
    description: "Les membres peuvent emprunter durant l'exercice. Les prêts portent intérêt et sont remboursés mensuellement.",
    details: [
      "Le Trésorier crée une demande de prêt depuis « Prêts ».",
      "Le Président approuve la demande — le prêt passe en statut ACTIVE.",
      "Le remboursement est enregistré en FIFO : intérêts d'abord, puis principal.",
      "Les prêts non remboursés à la cassation sont reconduits en N+1 avec coefficient ×1.04.",
    ],
    href: '/loans',
    linkLabel: 'Voir les prêts',
  },
  {
    id: 'beneficiaries',
    title: 'Attribuer les pots (bénéficiaires)',
    category: 'Opérations',
    icon: Gift,
    color: 'bg-teal-100 text-teal-700',
    description: "Chaque mois, un ou plusieurs membres reçoivent le « pot » collecté. L'attribution se fait via le tableau de rotation.",
    details: [
      "Allez dans « Bénéficiaires » pour voir le tableau de rotation de l'exercice.",
      "Le Président désigne un membre pour chaque slot mensuel.",
      "Une fois livré, le Trésorier marque le slot comme « Livré ».",
      "Un membre peut recevoir le pot plusieurs fois selon son nombre de parts.",
    ],
    href: '/beneficiaries',
    linkLabel: 'Voir les bénéficiaires',
  },
  {
    id: 'rescue-fund',
    title: 'Gérer la caisse de secours',
    category: 'Opérations',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-700',
    description: "La caisse de secours finance les événements de vie des membres (décès, mariage, naissance, maladie…).",
    details: [
      "Le solde est alimenté par une partie des cotisations mensuelles.",
      "Le Président ou VP enregistre un décaissement depuis « Caisse de secours ».",
      "Le montant est automatiquement calculé selon le type d'événement (configurable).",
      "Visualisez la jauge de remplissage pour surveiller le niveau de la caisse.",
    ],
    href: '/rescue-fund',
    linkLabel: 'Voir la caisse',
  },
  {
    id: 'cassation',
    title: 'Lancer la cassation',
    category: 'Avancé',
    icon: Gavel,
    color: 'bg-orange-100 text-orange-700',
    description: "La cassation est la clôture annuelle : elle redistribue l'épargne + intérêts à chaque membre et clôture l'exercice.",
    details: [
      "L'exercice doit être en statut CASSATION (ouvert par le Super Admin).",
      "Le Trésorier ou Super Admin lance la cassation depuis la page dédiée.",
      "Le système calcule automatiquement la redistribution pour chaque membre.",
      "Les prêts non remboursés sont reconduits avec un coefficient ×1.04.",
      "L'exercice passe en CLOSED — les données sont archivées.",
    ],
    href: '/cassation',
    linkLabel: 'Voir la cassation',
  },
  {
    id: 'exports',
    title: 'Exporter les rapports',
    category: 'Avancé',
    icon: BarChart3,
    color: 'bg-slate-100 text-slate-700',
    description: "Tous les rapports peuvent être exportés en Excel ou PDF directement depuis votre navigateur.",
    details: [
      "Allez dans « Rapports » et sélectionnez l'exercice cible.",
      "Choisissez le type de rapport : Épargnes, Sessions ou Bénéficiaires.",
      "Cliquez sur Excel pour un fichier .xlsx ou PDF pour un document imprimable.",
      "Les fichiers sont générés côté client — aucune donnée ne quitte votre réseau.",
    ],
    href: '/reports',
    linkLabel: 'Aller aux rapports',
  },
];

const CATEGORIES = ['Démarrage', 'Opérations', 'Avancé'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  'Démarrage': 'bg-blue-100 text-blue-700',
  'Opérations': 'bg-emerald-100 text-emerald-700',
  'Avancé': 'bg-orange-100 text-orange-700',
};

const STORAGE_KEY = 'caya_guide_completed';

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveCompleted(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch (_e) {
    // localStorage non disponible (mode privé, SSR)
  }
}

export default function GuidePage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(STEPS[0].id);
  const [filter, setFilter] = useState<string>('Tous');

  useEffect(() => {
    setCompleted(loadCompleted());
  }, []);

  const toggle = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      saveCompleted(next);
      return next;
    });
  };

  const reset = () => {
    setCompleted(new Set());
    saveCompleted(new Set());
  };

  const filteredSteps = filter === 'Tous' ? STEPS : STEPS.filter((s) => s.category === filter);
  const pct = Math.round((completed.size / STEPS.length) * 100);
  const selectedStep = STEPS.find((s) => s.id === selected);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Guide d'utilisation"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Guide' }]}
        action={
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        }
      />

      {/* Barre de progression globale */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Progression</span>
          </div>
          <span className="text-sm font-bold tabular-nums text-blue-600">{pct} % ({completed.size}/{STEPS.length})</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2.5 rounded-full transition-all duration-500 bg-blue-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Vous maîtrisez toute l'application !
          </p>
        )}
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 flex-wrap">
        {['Tous', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              filter === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Liste étapes */}
        <div className="space-y-1.5">
          {filteredSteps.map((step) => {
            const Icon = step.icon;
            const done = completed.has(step.id);
            const isSelected = selected === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setSelected(step.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-emerald-100' : step.color}`}>
                  {done
                    ? <Check className="h-4 w-4 text-emerald-600" />
                    : <Icon className="h-4 w-4" strokeWidth={2} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {step.title}
                  </p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[step.category]}`}>
                    {step.category}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-blue-500' : 'text-gray-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Détail de l'étape sélectionnée */}
        {selectedStep && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-card p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selectedStep.color}`}>
                <selectedStep.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">{selectedStep.title}</h2>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[selectedStep.category]}`}>
                    {selectedStep.category}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedStep.description}</p>
              </div>
            </div>

            {/* Étapes détaillées */}
            <ol className="space-y-3 mb-6">
              {selectedStep.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{detail}</p>
                </li>
              ))}
            </ol>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              {selectedStep.href && (
                <Link
                  href={selectedStep.href}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  {selectedStep.linkLabel ?? 'Aller à cette section'}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={() => toggle(selectedStep.id)}
                className={`ml-auto flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  completed.has(selectedStep.id)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <Check className="h-4 w-4" />
                {completed.has(selectedStep.id) ? 'Marquer comme non lu' : 'Marquer comme lu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
