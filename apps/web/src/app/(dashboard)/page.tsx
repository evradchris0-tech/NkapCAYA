'use client';

import { Users, Calendar, Shield, TrendingUp, type LucideIcon } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import { Skeleton } from '@components/ui/Skeleton';
import ChartCard from '@components/ui/ChartCard';
import { useMembers } from '@lib/hooks/useMembers';
import { useFiscalYears, useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useRescueFundLedger } from '@lib/hooks/useRescueFund';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import type { FiscalYear } from '@/types/api.types';
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: membersData, isLoading: loadingMembers } = useMembers({ page: 1, limit: 1 });
  const { data: fiscalYears, isLoading: loadingFY } = useFiscalYears();
  const activeFY = fiscalYears?.find((fy: FiscalYear) => fy.status === 'ACTIVE');

  const { data: memberships, isLoading: loadingMemberships } = useFiscalYearMemberships(activeFY?.id ?? '');
  const { data: rescueLedger, isLoading: loadingRescue } = useRescueFundLedger(activeFY?.id ?? '');
  const { data: sessions, isLoading: loadingSessions } = useSessionsByFiscalYear(activeFY?.id ?? '');

  const totalMembers   = membersData?.total ?? 0;
  const enrolledCount  = memberships?.length ?? 0;
  const rescueBalance  = rescueLedger ? Number(rescueLedger.totalBalance) : 0;

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
    { name: 'Nouveaux',       value: newCount,       color: COLORS.emerald },
    { name: 'Ré-inscriptions', value: returningCount, color: COLORS.blue },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tableau de bord"
        breadcrumbs={[{ label: 'Accueil' }]}
      />

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
          value={activeFY?.label ?? '—'}
          isLoading={loadingFY}
          sub={activeFY ? 'ACTIF' : 'Aucun exercice actif'}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Membres inscrits (FY)"
          value={activeFY ? enrolledCount : '—'}
          isLoading={loadingMemberships && !!activeFY}
          sub={activeFY ? activeFY.label : undefined}
        />
        <KpiCard
          icon={Shield}
          iconBg="bg-violet-50" iconColor="text-violet-600"
          label="Caisse de secours"
          value={activeFY ? `${formatAmount(rescueBalance)} XAF` : '—'}
          isLoading={loadingRescue && !!activeFY}
          sub={activeFY ? undefined : 'Aucun exercice actif'}
        />
      </div>

      {/* ── Graphes ── */}
      {activeFY && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Barres : collecte par session */}
          <ChartCard
            title="Collecte par session"
            subtitle={activeFY.label}
            className="lg:col-span-2"
          >
            {loadingSessions ? (
              <div className="h-56 flex items-center justify-center text-gray-300 text-sm">Chargement…</div>
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
              <div className="h-56 flex items-center justify-center text-gray-300 text-sm">Chargement…</div>
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
                      formatter={(value, entry: any) => (
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

      {/* ── Résumé exercice actif ── */}
      {activeFY && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Exercice actif — {activeFY.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Début',         value: new Date(activeFY.startDate).toLocaleDateString('fr-FR') },
              { label: 'Fin',           value: new Date(activeFY.endDate).toLocaleDateString('fr-FR') },
              { label: 'Limite prêts',  value: new Date(activeFY.loanDueDate).toLocaleDateString('fr-FR') },
              { label: 'Cassation',     value: new Date(activeFY.cassationDate).toLocaleDateString('fr-FR') },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeFY && !loadingFY && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
          Aucun exercice fiscal actif. Créez et activez un exercice pour commencer.
        </div>
      )}
    </div>
  );
}
