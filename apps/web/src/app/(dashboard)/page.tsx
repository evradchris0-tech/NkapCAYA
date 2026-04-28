'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Shield,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Medal,
  Wallet,
  Banknote,
  Coins,
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
import { useFiscalYearSavings } from '@lib/hooks/useSavings';
import { useFiscalYearLoans } from '@lib/hooks/useLoans';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import type { MonthlySession } from '@/types/api.types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
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
  borderColor: string;
  label: string;
  value: string | number;
  isLoading?: boolean;
  description: string;
}

function KpiCard({ icon: Icon, iconBg, iconColor, borderColor, label, value, isLoading, description }: KpiCardProps) {
  return (
    <div className={`bg-white rounded-xl border shadow-card hover:shadow-card-hover transition-shadow p-5 ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
        <span title={description} className="cursor-help">
          <Info className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500 transition-colors" />
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">
        {isLoading ? <Skeleton className="h-7 w-20" /> : value}
      </div>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return n.toLocaleString('fr-FR');
}

// ── Tooltip personnalisé ──────────────────────────────────────────────────────
interface TooltipPayloadEntry { name: string; value: number; color: string }
interface TooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }
function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry) => (
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
  const { data: activeMembersData } = useMembers({ page: 1, limit: 1, isActive: true });
  const { data: memberships, isLoading: loadingMemberships } =
    useFiscalYearMemberships(selectedFyId);
  const { data: rescueLedger, isLoading: loadingRescue } = useRescueFundLedger(selectedFyId);
  const { data: sessions, isLoading: loadingSessions } = useSessionsByFiscalYear(selectedFyId);
  const { data: savingsLedgers } = useFiscalYearSavings(selectedFyId ?? '');
  const { data: fyLoans } = useFiscalYearLoans(selectedFyId ?? '');
  const { data: fySchedule } = useBeneficiarySchedule(selectedFyId ?? '');

  const totalMembers   = membersData?.total ?? 0;
  const activeMembers  = activeMembersData?.total ?? 0;
  const enrolledCount  = memberships?.length ?? 0;
  const rescueBalance  = rescueLedger ? Number(rescueLedger.totalBalance) : 0;

  // ── KPI financiers ─────────────────────────────────────────────────────
  const totalEpargne = useMemo(
    () => (savingsLedgers ?? []).reduce((s, l) => s + parseFloat(l.principalBalance || '0'), 0),
    [savingsLedgers],
  );
  const totalInterets = useMemo(
    () => (savingsLedgers ?? []).reduce((s, l) => s + parseFloat(l.totalInterestReceived || '0'), 0),
    [savingsLedgers],
  );
  const activeLoansCount = useMemo(
    () => (fyLoans ?? []).filter((l) => l.status !== 'CLOSED').length,
    [fyLoans],
  );
  const totalEncoursPrets = useMemo(
    () => (fyLoans ?? []).filter((l) => l.status !== 'CLOSED').reduce((s, l) => s + parseFloat(l.outstandingBalance || '0'), 0),
    [fyLoans],
  );
  const totalCotisations = useMemo(
    () => (sessions ?? []).reduce((s, sess) => s + parseFloat(sess.totalCotisation || '0'), 0),
    [sessions],
  );

  // ── Données graphes supplémentaires ────────────────────────────────────
  const savingsChartData = useMemo(() => (sessions ?? []).map((s) => ({
    label: `S${s.sessionNumber}`,
    Épargne: Math.round(parseFloat(s.totalEpargne || '0')),
  })), [sessions]);

  const cotisationsChartData = useMemo(() => (sessions ?? []).map((s) => ({
    label: `S${s.sessionNumber}`,
    Cotisations: Math.round(parseFloat(s.totalCotisation || '0')),
  })), [sessions]);

  // Session ouverte en cours
  const openSession = sessions?.find((s) => s.status === 'OPEN');

  // ── Données graphe sessions ─────────────────────────────────────────────
  const deliveredBySession = useMemo(() => {
    const map: Record<string, number> = {};
    for (const slot of fySchedule?.slots ?? []) {
      if (slot.status === 'DELIVERED') {
        map[slot.sessionId] = (map[slot.sessionId] ?? 0) + parseFloat(slot.amountDelivered || '0');
      }
    }
    return map;
  }, [fySchedule]);

  const sessionChartData = useMemo(() => (sessions ?? []).map((s) => {
    const collecte = Math.round(
      [s.totalCotisation, s.totalPot, s.totalInscription, s.totalSecours,
       s.totalRbtPrincipal, s.totalRbtInterest, s.totalEpargne, s.totalProjet, s.totalAutres]
        .reduce((sum, v) => sum + parseFloat(v || '0'), 0),
    );
    const verse = deliveredBySession[s.id] ?? 0;
    return {
      label: `S${s.sessionNumber}`,
      Collecté: collecte,
      'Reste en caisse': Math.max(0, collecte - verse),
    };
  }), [sessions, deliveredBySession]);

  // ── Données donut inscriptions ──────────────────────────────────────────
  const newCount       = memberships?.filter((m) => m.enrollmentType === 'NEW').length ?? 0;
  const returningCount = memberships?.filter((m) => m.enrollmentType === 'RETURNING').length ?? 0;
  const enrollmentData = [
    { name: 'Nouveaux',        value: newCount,       color: COLORS.emerald },
    { name: 'Ré-inscriptions', value: returningCount, color: COLORS.blue },
  ].filter((d) => d.value > 0);

  // ── Suggestions ────────────────────────────────────────────────────────
  const suggestions = buildSuggestions(sessions, totalMembers, enrolledCount);

  // ── Map membershipId → nom ──────────────────────────────────────────────
  const membershipNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of memberships ?? []) {
      const name = [m.profile?.lastName, m.profile?.firstName].filter(Boolean).join(' ');
      map[m.id] = name || m.profile?.memberCode || m.id.slice(-6);
    }
    return map;
  }, [memberships]);

  // ── Top 5 épargnants ──────────────────────────────────────────────────
  const top5Savers = useMemo(() =>
    [...(savingsLedgers ?? [])]
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
      .slice(0, 5),
  [savingsLedgers]);

  // ── Top 5 emprunteurs (en cours) ──────────────────────────────────────
  const top5Loans = useMemo(() =>
    [...(fyLoans ?? [])]
      .filter((l) => l.status !== 'CLOSED')
      .sort((a, b) => parseFloat(b.principalAmount) - parseFloat(a.principalAmount))
      .slice(0, 5),
  [fyLoans]);

  // ── 5 sessions récentes ────────────────────────────────────────────────
  const recentSessions = [...(sessions ?? [])]
    .sort((a, b) => b.sessionNumber - a.sessionNumber)
    .slice(0, 5);

  // ── Dernières actions (dérivées des sessions) ────────────────────────
  type ActionItem = { id: string; icon: LucideIcon; iconCls: string; label: string; sub: string; href?: string; date: Date };
  const recentActions = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];
    for (const s of sessions ?? []) {
      if (s.closedAt) {
        items.push({
          id: `closed-${s.id}`,
          icon: CheckCircle2,
          iconCls: 'text-emerald-600',
          label: `Session #${s.sessionNumber} clôturée`,
          sub: s.location ?? 'Sans lieu',
          href: `/sessions/${s.id}`,
          date: new Date(s.closedAt),
        });
      }
      if (s.openedAt) {
        items.push({
          id: `opened-${s.id}`,
          icon: Calendar,
          iconCls: 'text-blue-600',
          label: `Session #${s.sessionNumber} ouverte`,
          sub: s.location ?? 'Sans lieu',
          href: `/sessions/${s.id}`,
          date: new Date(s.openedAt),
        });
      }
    }
    return items
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);
  }, [sessions]);

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
          borderColor="border-blue-100"
          label="Membres"
          value={loadingMembers ? '…' : `${activeMembers} / ${totalMembers}`}
          isLoading={false}
          description={`${activeMembers} actifs sur ${totalMembers} enregistrés au total.`}
        />
        <KpiCard
          icon={Calendar}
          iconBg="bg-emerald-50" iconColor="text-emerald-600"
          borderColor="border-emerald-100"
          label="Exercice fiscal actif"
          value={selectedFy?.label ?? '—'}
          isLoading={loadingFY}
          description={selectedFy ? `Statut : ${selectedFy.status}` : 'Aucun exercice actif en cours.'}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-indigo-50" iconColor="text-indigo-600"
          borderColor="border-indigo-100"
          label="Membres inscrits (FY)"
          value={selectedFy ? enrolledCount : '—'}
          isLoading={loadingMemberships && !!selectedFy}
          description={selectedFy ? `Inscrits pour ${selectedFy.label}` : 'Sélectionnez un exercice actif.'}
        />
        <KpiCard
          icon={Shield}
          iconBg="bg-violet-50" iconColor="text-violet-600"
          borderColor="border-violet-100"
          label="Caisse de secours"
          value={selectedFy ? `${rescueBalance.toLocaleString('fr-FR')} XAF` : '—'}
          isLoading={loadingRescue && !!selectedFy}
          description="Solde total disponible dans la caisse de secours."
        />
      </div>

      {/* ── KPI Financiers ── */}
      {selectedFy && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={Wallet}
            iconBg="bg-emerald-50" iconColor="text-emerald-600"
            borderColor="border-emerald-100"
            label="Total Épargne"
            value={`${totalEpargne.toLocaleString('fr-FR')} XAF`}
            description="Somme des capitaux déposés par tous les membres."
          />
          <KpiCard
            icon={TrendingUp}
            iconBg="bg-amber-50" iconColor="text-amber-600"
            borderColor="border-amber-100"
            label="Total Intérêts"
            value={`${totalInterets.toLocaleString('fr-FR')} XAF`}
            description="Intérêts distribués sur l'épargne de l'exercice."
          />
          <KpiCard
            icon={Banknote}
            iconBg="bg-orange-50" iconColor="text-orange-500"
            borderColor="border-orange-100"
            label="Prêts en cours"
            value={`${activeLoansCount} — ${formatAmount(totalEncoursPrets)} XAF`}
            description={`${activeLoansCount} prêt${activeLoansCount > 1 ? 's' : ''} actif${activeLoansCount > 1 ? 's' : ''}, encours total.`}
          />
          <KpiCard
            icon={Coins}
            iconBg="bg-blue-50" iconColor="text-blue-600"
            borderColor="border-blue-100"
            label="Total Cotisations"
            value={`${totalCotisations.toLocaleString('fr-FR')} XAF`}
            description="Cotisations collectées sur toutes les sessions."
          />
        </div>
      )}

      {/* ── Actions rapides ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Sessions',       href: '/sessions',      icon: Calendar,     bg: 'bg-emerald-50', hoverBg: 'group-hover:bg-emerald-100', iconCls: 'text-emerald-600', hoverText: 'group-hover:text-emerald-700', border: 'hover:border-emerald-200' },
            { label: 'Membres',        href: '/members',       icon: Users,        bg: 'bg-blue-50',    hoverBg: 'group-hover:bg-blue-100',    iconCls: 'text-blue-600',    hoverText: 'group-hover:text-blue-700',    border: 'hover:border-blue-200'    },
            { label: 'Prêts',          href: '/loans',         icon: TrendingUp,   bg: 'bg-orange-50',  hoverBg: 'group-hover:bg-orange-100',  iconCls: 'text-orange-500',  hoverText: 'group-hover:text-orange-600',  border: 'hover:border-orange-200'  },
            { label: 'Caisse secours', href: '/rescue-fund',   icon: Shield,       bg: 'bg-violet-50',  hoverBg: 'group-hover:bg-violet-100',  iconCls: 'text-violet-600',  hoverText: 'group-hover:text-violet-700',  border: 'hover:border-violet-200'  },
            { label: 'Bénéficiaires',  href: '/beneficiaries', icon: CheckCircle2, bg: 'bg-teal-50',    hoverBg: 'group-hover:bg-teal-100',    iconCls: 'text-teal-600',    hoverText: 'group-hover:text-teal-700',    border: 'hover:border-teal-200'    },
            { label: 'Épargne',        href: '/savings',       icon: Clock,        bg: 'bg-rose-50',    hoverBg: 'group-hover:bg-rose-100',    iconCls: 'text-rose-500',    hoverText: 'group-hover:text-rose-600',    border: 'hover:border-rose-200'    },
          ].map(({ label, href, icon: Icon, bg, hoverBg, iconCls, hoverText, border }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-xl border border-gray-100 p-3.5 bg-white hover:shadow-md transition-all duration-200 group ${border}`}
            >
              <div className={`p-2.5 rounded-xl transition-all duration-200 ${bg} ${hoverBg} group-hover:scale-110`}>
                <Icon className={`h-5 w-5 transition-colors duration-200 ${iconCls}`} strokeWidth={2} />
              </div>
              <span className={`text-xs font-medium text-center leading-tight transition-colors duration-200 text-gray-600 ${hoverText}`}>
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
                  <BarChart data={sessionChartData} barSize={14} barCategoryGap="30%" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    <Bar dataKey="Collecté" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Reste en caisse" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
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
                      formatter={(value: string, entry: { payload?: { value?: number } }) => (
                        <span className="text-xs text-gray-600">{value} ({entry.payload?.value ?? 0})</span>
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

      {/* ── Graphes financiers ── */}
      {selectedFy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Barres : Épargne déposée par session */}
          <ChartCard
            title="Épargne déposée par session"
            subtitle={selectedFy.label}
          >
            {loadingSessions ? (
              <div className="h-56 flex items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : savingsChartData.every((d) => d.Épargne === 0) ? (
              <div className="h-56 flex items-center justify-center text-gray-300 text-sm">
                Aucune épargne enregistrée
              </div>
            ) : (
              <div className="h-56 px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingsChartData} barSize={14} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="Épargne" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* Ligne : Évolution des cotisations */}
          <ChartCard
            title="Évolution des cotisations"
            subtitle={selectedFy.label}
          >
            {loadingSessions ? (
              <div className="h-56 flex items-center justify-center">
                <Skeleton className="h-40 w-full" />
              </div>
            ) : cotisationsChartData.every((d) => d.Cotisations === 0) ? (
              <div className="h-56 flex items-center justify-center text-gray-300 text-sm">
                Aucune cotisation enregistrée
              </div>
            ) : (
              <div className="h-56 px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cotisationsChartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAmount} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0' }} />
                    <Line type="monotone" dataKey="Cotisations" stroke={COLORS.blue} strokeWidth={2.5} dot={{ fill: COLORS.blue, r: 3 }} />
                  </LineChart>
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
        <div className="rounded-xl border border-teal-100 shadow-card p-5 animate-slide-up" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
          <h2 className="text-sm font-semibold text-teal-800 mb-4">
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

      {/* ── Top 5 Épargne + Prêts ── */}
      {selectedFy && (top5Savers.length > 0 || top5Loans.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-slide-up">

          {/* Top 5 épargnants */}
          {top5Savers.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-100 shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-emerald-100 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)' }}>
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Medal className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                </div>
                <h2 className="text-sm font-semibold text-emerald-800">Top 5 — Épargne</h2>
                <Link href="/savings" className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {top5Savers.map((ledger, i) => {
                  const name = membershipNameMap[ledger.membershipId] ?? ledger.membershipId.slice(-6);
                  const balance = parseFloat(ledger.balance);
                  const maxBalance = parseFloat(top5Savers[0].balance);
                  const pct = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;
                  return (
                    <li key={ledger.membershipId} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-100 text-gray-500' :
                        i === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1 bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-emerald-700 shrink-0">
                        {balance.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">XAF</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Top 5 emprunteurs */}
          {top5Loans.length > 0 && (
            <div className="bg-white rounded-xl border border-orange-100 shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-orange-100 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #fff7ed 0%, #fed7aa 100%)' }}>
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-orange-500" strokeWidth={2} />
                </div>
                <h2 className="text-sm font-semibold text-orange-800">Top 5 — Prêts en cours</h2>
                <Link href="/loans" className="ml-auto text-xs text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1">
                  Voir tout <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {top5Loans.map((loan, i) => {
                  const name = membershipNameMap[loan.membershipId] ?? loan.membershipId.slice(-6);
                  const principal = parseFloat(loan.principalAmount);
                  const outstanding = parseFloat(loan.outstandingBalance);
                  const maxPrincipal = parseFloat(top5Loans[0].principalAmount);
                  const pct = maxPrincipal > 0 ? (principal / maxPrincipal) * 100 : 0;
                  const repaidPct = principal > 0 ? Math.round(((principal - outstanding) / principal) * 100) : 0;
                  return (
                    <li key={loan.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-100 text-gray-500' :
                        i === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1 bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums text-orange-700">
                          {principal.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">XAF</span>
                        </p>
                        <p className="text-[11px] text-gray-400">{repaidPct}% remboursé</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

        </div>
      )}

      {/* ── Sessions récentes ── */}
      {selectedFy && (
        <div className="rounded-xl border border-blue-100 shadow-card overflow-hidden animate-slide-up" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
          <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)' }}>
            <h2 className="text-sm font-semibold text-blue-800">Sessions récentes</h2>
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

      {/* ── Dernières actions ── */}
      {selectedFy && (
        <div className="rounded-xl border border-emerald-100 shadow-card overflow-hidden animate-slide-up" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
          <div className="px-6 py-4 border-b border-emerald-100 flex items-center gap-2" style={{ background: 'linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <Activity className="h-4 w-4 text-emerald-500" strokeWidth={2} />
            <h2 className="text-sm font-semibold text-emerald-800">Dernières actions</h2>
          </div>

          {loadingSessions ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-6 py-3.5 flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-3 w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : recentActions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              Aucune action récente pour cet exercice.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentActions.map((action) => {
                const Icon = action.icon;
                const row = (
                  <div className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors shrink-0">
                      <Icon className={`h-3.5 w-3.5 ${action.iconCls}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{action.label}</p>
                      <p className="text-xs text-gray-400 truncate">{action.sub}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                      {action.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                );
                return (
                  <li key={action.id}>
                    {action.href ? <Link href={action.href}>{row}</Link> : row}
                  </li>
                );
              })}
            </ul>
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
