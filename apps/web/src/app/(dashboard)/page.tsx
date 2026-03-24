'use client';

import Link from 'next/link';
import {
  Users,
  Calendar,
  Shield,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import { Skeleton } from '@components/ui/Skeleton';
import ChartCard from '@components/ui/ChartCard';
import { useMembers } from '@lib/hooks/useMembers';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useRescueFundLedger } from '@lib/hooks/useRescueFund';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import type { MonthlySession } from '@/types/api.types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── Palette centralisée ──────────────────────────────────────────────────────
const COLORS = {
  blue:    '#3b82f6',
  emerald: '#10b981',
  amber:   '#f59e0b',
  violet:  '#8b5cf6',
  rose:    '#f43f5e',
  teal:    '#14b8a6',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  isLoading?: boolean;
  sub?: string;
}

function KpiCard({ icon: Icon, iconBg, iconColor, label, value, isLoading, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">
          {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : value}
        </div>
        {sub && !isLoading && (
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return n.toLocaleString('fr-FR');
}

// ── Tooltip personnalisé ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="tabular-nums">
          {entry.name} : {Number(entry.value).toLocaleString('fr-FR')} XAF
        </p>
      ))}
    </div>
  );
}

// ── Badge statut session ──────────────────────────────────────────────────────
const SESSION_STATUS_LABELS: Record<string, string> = {
  OPEN:              'Ouverte',
  CLOSED_FOR_REVIEW: 'En révision',
  CLOSED:            'Clôturée',
};

const SESSION_STATUS_COLORS: Record<string, string> = {
  OPEN:              'bg-green-100 text-green-700',
  CLOSED_FOR_REVIEW: 'bg-amber-100 text-amber-700',
  CLOSED:            'bg-gray-100 text-gray-500',
};

function SessionBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SESSION_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {SESSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Suggestions ──────────────────────────────────────────────────────────────
interface Suggestion {
  id: string;
  icon: LucideIcon;
  text: string;
}

function buildSuggestions(
  sessions: MonthlySession[] | undefined,
  totalMembers: number,
  enrolledCount: number,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Règle 1 : % sessions clôturées > 80 %
  if (sessions && sessions.length > 0) {
    const closedCount = sessions.filter((s) => s.status === 'CLOSED').length;
    const pct = closedCount / sessions.length;
    if (pct > 0.8) {
      suggestions.push({
        id: 'cassation',
        icon: AlertCircle,
        text: 'La cassation approche — vérifiez les prêts en cours et soldez les comptes avant clôture.',
      });
    }
  }

  // Règle 2 : membres non inscrits à l'exercice
  const nonEnrolled = totalMembers - enrolledCount;
  if (nonEnrolled > 0) {
    suggestions.push({
      id: 'enrollment',
      icon: Users,
      text: `${nonEnrolled} membre${nonEnrolled > 1 ? 's' : ''} non encore inscrit${nonEnrolled > 1 ? 's' : ''} à l'exercice actif. Pensez à les inscrire.`,
    });
  }

  // Règle 3 : toujours présente
  suggestions.push({
    id: 'export',
    icon: CheckCircle2,
    text: 'Pensez à exporter les rapports de l\'exercice en cours avant la cassation.',
  });

  return suggestions;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { selectedFyId, selectedFy, isLoading: loadingFY } = useFiscalYearContext();

  const { data: membersData, isLoading: loadingMembers } = useMembers({ page: 1, limit: 1 });
  const { data: memberships, isLoading: loadingMemberships } =
    useFiscalYearMemberships(selectedFyId);
  const { data: rescueLedger, isLoading: loadingRescue } = useRescueFundLedger(selectedFyId);
  const { data: sessions, isLoading: loadingSessions } = useSessionsByFiscalYear(selectedFyId);

  const totalMembers  = membersData?.total ?? 0;
  const enrolledCount = memberships?.length ?? 0;
  const rescueBalance = rescueLedger ? Number(rescueLedger.totalBalance) : 0;

  // Session ouverte en cours
  const openSession = sessions?.find((s) => s.status === 'OPEN');

  // ── Données graphe sessions ─────────────────────────────────────────────
  const sessionChartData = (sessions ?? []).map((s) => ({
    label: `S${s.sessionNumber}`,
    Collecté: Math.round(
      [s.totalCotisation, s.totalPot, s.totalInscription, s.totalSecours,
       s.totalRbtPrincipal, s.totalRbtInterest, s.totalEpargne, s.totalProjet, s.totalAutres]
        .reduce((sum, v) => sum + parseFloat(v || '0'), 0)
    ),
  }));

  // ── Données donut inscriptions ──────────────────────────────────────────
  const newCount       = memberships?.filter((m) => m.enrollmentType === 'NEW').length ?? 0;
  const returningCount = memberships?.filter((m) => m.enrollmentType === 'RETURNING').length ?? 0;
  const enrollmentData = [
    { name: 'Nouveaux',        value: newCount,       color: COLORS.emerald },
    { name: 'Ré-inscriptions', value: returningCount, color: COLORS.blue },
  ].filter((d) => d.value > 0);

  // ── Suggestions ────────────────────────────────────────────────────────
  const suggestions = buildSuggestions(sessions, totalMembers, enrolledCount);

  // ── 5 sessions récentes ────────────────────────────────────────────────
  const recentSessions = [...(sessions ?? [])]
    .sort((a, b) => b.sessionNumber - a.sessionNumber)
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tableau de bord"
        breadcrumbs={[{ label: 'Accueil' }]}
      />

      {/* ── Banner session ouverte ── */}
      {openSession && (
        <Link
          href={`/sessions/${openSession.id}`}
          className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3.5 hover:bg-emerald-100 transition-colors group"
        >
          <div className="p-1.5 bg-emerald-500 rounded-lg shrink-0">
            <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">
              Session #{openSession.sessionNumber} est actuellement ouverte
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {openSession.location
                ? `${openSession.location} — `
                : ''}
              {new Date(openSession.meetingDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          iconBg="bg-blue-50" iconColor="text-blue-600"
          label="Membres enregistrés"
          value={totalMembers}
          isLoading={loadingMembers}
        />
        <KpiCard
          icon={Calendar}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="Exercice en cours"
          value={selectedFy?.label ?? '—'}
          isLoading={loadingFY}
          sub={selectedFy ? selectedFy.status : 'Aucun exercice actif'}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Membres inscrits (FY)"
          value={selectedFy ? enrolledCount : '—'}
          isLoading={loadingMemberships && !!selectedFy}
          sub={selectedFy ? selectedFy.label : undefined}
        />
        <KpiCard
          icon={Shield}
          iconBg="bg-violet-50" iconColor="text-violet-600"
          label="Caisse de secours"
          value={selectedFy ? `${formatAmount(rescueBalance)} XAF` : '—'}
          isLoading={loadingRescue && !!selectedFy}
          sub={selectedFy ? undefined : 'Aucun exercice actif'}
        />
      </div>

      {/* ── Actions rapides ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Sessions',       href: '/sessions',      icon: Calendar,  bg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
            { label: 'Membres',        href: '/members',       icon: Users,     bg: 'bg-blue-50',    iconCls: 'text-blue-600'    },
            { label: 'Prêts',          href: '/loans',         icon: TrendingUp,bg: 'bg-amber-50',   iconCls: 'text-amber-600'   },
            { label: 'Caisse secours', href: '/rescue-fund',   icon: Shield,    bg: 'bg-violet-50',  iconCls: 'text-violet-600'  },
            { label: 'Bénéficiaires',  href: '/beneficiaries', icon: CheckCircle2, bg: 'bg-teal-50', iconCls: 'text-teal-600'   },
            { label: 'Épargne',        href: '/savings',       icon: Clock,     bg: 'bg-rose-50',    iconCls: 'text-rose-600'    },
          ].map(({ label, href, icon: Icon, bg, iconCls }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-3.5 hover:shadow-card-hover hover:border-gray-200 transition-all group"
            >
              <div className={`p-2.5 rounded-xl ${bg} group-hover:scale-105 transition-transform`}>
                <Icon className={`h-5 w-5 ${iconCls}`} strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Graphes ── */}
      {selectedFy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Barres : collecte par session */}
          <ChartCard
            title="Collecte par session"
            subtitle={selectedFy.label}
            className="lg:col-span-2"
          >
            {loadingSessions ? (
              <div className="h-56 flex items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : sessionChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-300 text-sm">
                Aucune session clôturée
              </div>
            ) : (
              <div className="h-56 px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionChartData} barSize={28} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Collecté" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* Donut : répartition inscriptions */}
          <ChartCard
            title="Type d'inscription"
            subtitle={`${enrolledCount} membre${enrolledCount > 1 ? 's' : ''} inscrit${enrolledCount > 1 ? 's' : ''}`}
          >
            {loadingMemberships ? (
              <div className="h-56 flex items-center justify-center">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : enrollmentData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-300 text-sm">
                Aucun membre inscrit
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrollmentData}
                      cx="50%"
                      cy="45%"
                      innerRadius={54}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {enrollmentData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string, entry: any) => (
                        <span className="text-xs text-gray-600">{value} ({entry.payload.value})</span>
                      )}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} membres`, name]}
                      contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

        </div>
      )}

      {/* ── Suggestions IA ── */}
      {selectedFy && suggestions.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-violet-800 mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-violet-500" />
            Suggestions
          </h2>
          <ul className="space-y-2.5">
            {suggestions.map(({ id, icon: Icon, text }) => (
              <li key={id} className="flex items-start gap-2.5">
                <div className="p-1 bg-violet-100 rounded-md shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-violet-600" strokeWidth={2} />
                </div>
                <p className="text-sm text-violet-900 leading-snug">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Résumé exercice actif ── */}
      {selectedFy && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Exercice actif — {selectedFy.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Début',        value: new Date(selectedFy.startDate).toLocaleDateString('fr-FR') },
              { label: 'Fin',          value: new Date(selectedFy.endDate).toLocaleDateString('fr-FR') },
              { label: 'Limite prêts', value: new Date(selectedFy.loanDueDate).toLocaleDateString('fr-FR') },
              { label: 'Cassation',    value: new Date(selectedFy.cassationDate).toLocaleDateString('fr-FR') },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sessions récentes ── */}
      {selectedFy && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Sessions récentes</h2>
            <Link
              href="/sessions"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loadingSessions ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Aucune session pour cet exercice.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Session</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600 hidden sm:table-cell">Lieu</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Statut</th>
                  <th className="px-6 py-3"><span className="sr-only">Lien</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-gray-800">
                      #{s.sessionNumber}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(s.meetingDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden sm:table-cell">
                      {s.location ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <SessionBadge status={s.status} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selectedFy && !loadingFY && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
          Aucun exercice fiscal actif. Créez et activez un exercice pour commencer.
        </div>
      )}
    </div>
  );
}
