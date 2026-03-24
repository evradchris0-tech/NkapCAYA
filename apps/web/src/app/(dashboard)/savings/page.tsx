'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import ChartCard from '@components/ui/ChartCard';
import { useSavingsByMembership } from '@lib/hooks/useSavings';
import { useFiscalYears, useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import type { SavingsEntryType } from '@/types/api.types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const ENTRY_TYPE_LABELS: Record<SavingsEntryType, string> = {
  DEPOSIT: 'Versement',
  INTEREST_CREDIT: 'Intérêts crédités',
};

const ENTRY_TYPE_COLORS: Record<SavingsEntryType, string> = {
  DEPOSIT: 'bg-green-100 text-green-700',
  INTEREST_CREDIT: 'bg-blue-100 text-blue-700',
};

export default function SavingsPage() {
  const { data: fiscalYears } = useFiscalYears();
  const activeFy = fiscalYears?.find((f) => f.status === 'ACTIVE');
  const { data: memberships } = useFiscalYearMemberships(activeFy?.id ?? '');

  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const { data: ledger, isLoading } = useSavingsByMembership(selectedMembershipId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Épargne et intérêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Épargne' }]}
      />

      {/* Filtre membre */}
      <div className="flex items-center gap-3">
        <label htmlFor="member-filter" className="text-sm font-medium text-gray-700">
          Membre :
        </label>
        <select
          id="member-filter"
          value={selectedMembershipId}
          onChange={(e) => setSelectedMembershipId(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">Sélectionner un membre…</option>
          {memberships?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
            </option>
          ))}
        </select>
      </div>

      {!selectedMembershipId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Sélectionnez un membre pour voir son épargne.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Chargement…
        </div>
      ) : !ledger ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Aucun compte d&apos;épargne trouvé pour ce membre.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Solde total',
                value: `${parseFloat(ledger.balance).toLocaleString('fr-FR')} XAF`,
                color: 'text-gray-900',
              },
              {
                label: 'Capital versé',
                value: `${parseFloat(ledger.principalBalance).toLocaleString('fr-FR')} XAF`,
                color: 'text-gray-900',
              },
              {
                label: 'Intérêts reçus',
                value: `${parseFloat(ledger.totalInterestReceived).toLocaleString('fr-FR')} XAF`,
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
          {ledger.entries && ledger.entries.length > 0 && (() => {
            // Agréger par mois : somme cumulative
            const byMonth: Record<number, { versement: number; interets: number; solde: number }> = {};
            ledger.entries.forEach((e) => {
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
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
                      <Tooltip
                        formatter={(v: number, name: string) => [`${v.toLocaleString('fr-FR')} XAF`, name]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend iconType="circle" iconSize={7} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                      <Area type="monotone" dataKey="Solde"    stroke="#3b82f6" strokeWidth={2} fill="url(#soldeGrad)"  dot={false} />
                      <Area type="monotone" dataKey="Intérêts" stroke="#10b981" strokeWidth={2} fill="url(#interetGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            );
          })()}

          {/* Historique */}
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
                        +{parseFloat(entry.amount).toLocaleString('fr-FR')} XAF
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-gray-600">
                        {parseFloat(entry.balanceAfter).toLocaleString('fr-FR')} XAF
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
      )}
    </div>
  );
}
