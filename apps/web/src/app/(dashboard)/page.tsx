'use client';

import { Users, Calendar, Shield, TrendingUp, type LucideIcon } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import { Skeleton } from '@components/ui/Skeleton';
import { useMembers } from '@lib/hooks/useMembers';
import { useFiscalYears, useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useRescueFundLedger } from '@lib/hooks/useRescueFund';
import type { FiscalYear } from '@/types/api.types';

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
        <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">
          {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : value}
        </p>
        {sub && !isLoading && (
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M XAF`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k XAF`;
  return `${n.toLocaleString('fr-FR')} XAF`;
}

export default function DashboardPage() {
  const { data: membersData, isLoading: loadingMembers } = useMembers({ page: 1, limit: 1 });
  const { data: fiscalYears, isLoading: loadingFY } = useFiscalYears();
  const activeFY = fiscalYears?.find((fy: FiscalYear) => fy.status === 'ACTIVE');

  const { data: memberships, isLoading: loadingMemberships } = useFiscalYearMemberships(activeFY?.id ?? '');
  const { data: rescueLedger, isLoading: loadingRescue } = useRescueFundLedger(activeFY?.id ?? '');

  const totalMembers = membersData?.total ?? 0;
  const enrolledCount = memberships?.length ?? 0;
  const rescueBalance = rescueLedger ? Number(rescueLedger.totalBalance) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tableau de bord"
        breadcrumbs={[{ label: 'Accueil' }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Membres enregistrés"
          value={totalMembers}
          isLoading={loadingMembers}
        />
        <KpiCard
          icon={Calendar}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Exercice en cours"
          value={activeFY?.label ?? '—'}
          isLoading={loadingFY}
          sub={activeFY ? 'ACTIF' : 'Aucun exercice actif'}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Membres inscrits (FY)"
          value={activeFY ? enrolledCount : '—'}
          isLoading={loadingMemberships && !!activeFY}
          sub={activeFY ? activeFY.label : undefined}
        />
        <KpiCard
          icon={Shield}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          label="Caisse de secours"
          value={activeFY ? formatAmount(rescueBalance) : '—'}
          isLoading={loadingRescue && !!activeFY}
          sub={activeFY ? undefined : 'Aucun exercice actif'}
        />
      </div>

      {/* Résumé exercice actif */}
      {activeFY && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 animate-slide-up">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Exercice actif — {activeFY.label}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Début</p>
              <p className="font-medium text-gray-800">
                {new Date(activeFY.startDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fin</p>
              <p className="font-medium text-gray-800">
                {new Date(activeFY.endDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Limite prêts</p>
              <p className="font-medium text-gray-800">
                {new Date(activeFY.loanDueDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cassation</p>
              <p className="font-medium text-gray-800">
                {new Date(activeFY.cassationDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
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
