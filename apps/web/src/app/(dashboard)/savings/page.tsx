'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import { useSavingsByMembership } from '@lib/hooks/useSavings';
import { useFiscalYears, useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import type { SavingsEntryType } from '@/types/api.types';

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
