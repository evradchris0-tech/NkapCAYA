'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import ChartCard from '@components/ui/ChartCard';
import Pagination from '@components/ui/Pagination';
import { Skeleton, SkeletonRow } from '@components/ui/Skeleton';
import Select from '@components/ui/Select';
import { useSavingsByMembership, useFiscalYearSavings } from '@lib/hooks/useSavings';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import type { SavingsEntryType, SavingsLedger, Membership } from '@/types/api.types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Constantes ────────────────────────────────────────────────────────────────

const ENTRY_TYPE_LABELS: Record<SavingsEntryType, string> = {
  DEPOSIT: 'Versement',
  INTEREST_CREDIT: 'Intérêts crédités',
};

const ENTRY_TYPE_COLORS: Record<SavingsEntryType, string> = {
  DEPOSIT: 'bg-green-100 text-green-700',
  INTEREST_CREDIT: 'bg-blue-100 text-blue-700',
};

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(raw: string): string {
  return parseFloat(raw).toLocaleString('fr-FR');
}

// ── Sous-composant : tableau global paginé ────────────────────────────────────

interface AllMembersTableProps {
  savings: SavingsLedger[];
  memberships: Membership[];
  isLoading: boolean;
  onSelect: (membershipId: string) => void;
}

function AllMembersTable({ savings, memberships, isLoading, onSelect }: AllMembersTableProps) {
  const [page, setPage] = useState(1);

  // Afficher tous les membres inscrits, avec leur épargne (0 si aucun ledger)
  const rows = memberships.map((membership) => {
    const ledger = savings.find((l) => l.membershipId === membership.id);
    return { ledger, membership };
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Épargne de tous les membres</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cliquez sur un membre pour voir le détail de son compte
          </p>
        </div>
        {!isLoading && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {total} membre{total > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 font-medium text-gray-600 w-10">#</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Code</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Solde total</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Capital versé</th>
              <th className="text-right px-6 py-3 font-medium text-gray-600">Intérêts reçus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : sliced.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                    Aucun membre inscrit pour cet exercice.
                  </td>
                </tr>
              )
              : sliced.map(({ ledger, membership }, index) => {
                  const fullName = membership.profile
                    ? `${membership.profile.lastName} ${membership.profile.firstName}`
                    : '—';
                  const code = membership.profile?.memberCode ?? '—';
                  const hasLedger = !!ledger;

                  return (
                    <tr
                      key={membership.id}
                      onClick={() => hasLedger ? onSelect(membership.id) : undefined}
                      className={hasLedger ? 'hover:bg-blue-50 cursor-pointer transition-colors' : 'opacity-50'}
                    >
                      <td className="px-6 py-3 text-gray-400 text-xs tabular-nums">{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{fullName}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">{code}</td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {hasLedger ? `${fmt(ledger.balance)} XAF` : <span className="text-gray-300 text-xs">Aucun versement</span>}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-gray-600">
                        {hasLedger ? `${fmt(ledger.principalBalance)} XAF` : '—'}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-blue-700">
                        {hasLedger ? `${fmt(ledger.totalInterestReceived)} XAF` : '—'}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {!isLoading && total > PAGE_SIZE && (
        <div className="px-6 py-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ── Sous-composant : détail d'un membre ───────────────────────────────────────

interface MemberDetailProps {
  membershipId: string;
  displayName: string;
}

function MemberDetail({ membershipId, displayName }: MemberDetailProps) {
  const { data: ledger, isLoading } = useSavingsByMembership(membershipId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
        Aucun compte d&apos;épargne trouvé pour ce membre.
      </div>
    );
  }

  // Agréger par mois pour le graphe
  const byMonth: Record<number, { versement: number; interets: number; solde: number }> = {};
  (ledger.entries ?? []).forEach((e) => {
    if (!byMonth[e.month]) byMonth[e.month] = { versement: 0, interets: 0, solde: 0 };
    if (e.type === 'DEPOSIT')         byMonth[e.month].versement += parseFloat(e.amount);
    if (e.type === 'INTEREST_CREDIT') byMonth[e.month].interets  += parseFloat(e.amount);
    byMonth[e.month].solde = parseFloat(e.balanceAfter);
  });
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([month, d]) => ({
      label: `M${month}`,
      Versement: d.versement,
      Intérêts: d.interets,
      Solde: d.solde,
    }));

  return (
    <>
      {/* Titre du membre sélectionné */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{displayName}</span>
        <span className="text-gray-400">— détail du compte</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Solde total',
            value: `${fmt(ledger.balance)} XAF`,
            color: 'text-gray-900',
          },
          {
            label: 'Capital versé',
            value: `${fmt(ledger.principalBalance)} XAF`,
            color: 'text-gray-900',
          },
          {
            label: 'Intérêts reçus',
            value: `${fmt(ledger.totalInterestReceived)} XAF`,
            color: 'text-blue-700',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`font-semibold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Graphe progression du solde */}
      {chartData.length > 0 && (
        <ChartCard title="Progression de l'épargne" subtitle="Solde cumulé par mois">
          <div className="h-56 px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="soldeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="interetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toLocaleString('fr-FR')} XAF`, name]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  formatter={(v: string) => <span className="text-xs text-gray-600">{v}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="Solde"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#soldeGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Intérêts"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#interetGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* Historique des mouvements */}
      {ledger.entries && ledger.entries.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Historique des mouvements</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Mois</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Solde après</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledger.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">M{entry.month}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ENTRY_TYPE_COLORS[entry.type]}`}
                    >
                      {ENTRY_TYPE_LABELS[entry.type]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">
                    +{fmt(entry.amount)} XAF
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-600">
                    {fmt(entry.balanceAfter)} XAF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Aucun mouvement enregistré.
        </div>
      )}
    </>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function SavingsPage() {
  const { selectedFyId, selectedFy } = useFiscalYearContext();

  const { data: memberships = [], isLoading: loadingMemberships } =
    useFiscalYearMemberships(selectedFyId);

  const { data: fysSavings = [], isLoading: loadingSavings } =
    useFiscalYearSavings(selectedFyId);

  const [selectedMembershipId, setSelectedMembershipId] = useState('');

  // Nom du membre sélectionné (pour l'affichage dans le détail)
  const selectedMembership = memberships.find((m) => m.id === selectedMembershipId);
  const selectedDisplayName = selectedMembership?.profile
    ? `${selectedMembership.profile.lastName} ${selectedMembership.profile.firstName}`
    : selectedMembershipId;

  const isLoading = loadingMemberships || loadingSavings;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Épargne et intérêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Épargne' }]}
      />

      {/* Filtre membre */}
      <div className="flex items-center gap-3 flex-wrap">
        <label htmlFor="member-filter" className="text-sm font-medium text-gray-700">
          Filtrer par membre :
        </label>
        {loadingMemberships ? (
          <Skeleton className="h-9 w-56" />
        ) : (
          <Select
            id="member-filter"
            value={selectedMembershipId}
            onChange={(e) => setSelectedMembershipId(e.target.value)}
            className="py-1.5 w-64"
          >
            <option value="">Tous les membres</option>
            {memberships.map((m) => (
              <option key={m.id} value={m.id}>
                {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
              </option>
            ))}
          </Select>
        )}
        {selectedMembershipId && (
          <button
            onClick={() => setSelectedMembershipId('')}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Voir tous
          </button>
        )}
        {selectedFy && (
          <span className="ml-auto text-xs text-gray-400">
            Exercice : <span className="font-medium text-gray-600">{selectedFy.label}</span>
          </span>
        )}
      </div>

      {/* Contenu : tableau global ou détail membre */}
      {!selectedFyId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
          Aucun exercice fiscal sélectionné.
        </div>
      ) : selectedMembershipId ? (
        <MemberDetail
          membershipId={selectedMembershipId}
          displayName={selectedDisplayName}
        />
      ) : (
        <AllMembersTable
          savings={fysSavings}
          memberships={memberships}
          isLoading={isLoading}
          onSelect={setSelectedMembershipId}
        />
      )}
    </div>
  );
}
