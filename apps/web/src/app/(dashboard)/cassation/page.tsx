'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import { useCassation, useExecuteCassation } from '@lib/hooks/useCassation';
import { useFiscalYears } from '@lib/hooks/useFiscalYear';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';

export default function CassationPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: fiscalYears } = useFiscalYears();
  const cassationFy = fiscalYears?.find((f) => f.status === 'CASSATION') ?? fiscalYears?.find((f) => f.status === 'CLOSED');
  const { data: record, isLoading, isError } = useCassation(cassationFy?.id ?? '');
  const executeCassation = useExecuteCassation(cassationFy?.id ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [execError, setExecError] = useState<string | null>(null);

  const canExecute =
    currentUser?.role === BureauRole.TRESORIER ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

  const handleExecute = async () => {
    setExecError(null);
    try {
      await executeCassation.mutateAsync();
      setConfirmOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'exécution de la cassation.';
      setExecError(msg);
    }
  };

  const noCassationFy = !cassationFy;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cassation"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Cassation' }]}
        action={
          canExecute && cassationFy?.status === 'CASSATION' && !record ? (
            <Button size="sm" onClick={() => setConfirmOpen(true)}>
              Lancer la cassation
            </Button>
          ) : undefined
        }
      />

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 max-w-xl">
          <h3 className="font-semibold text-amber-800 mb-2">Confirmer la cassation</h3>
          <p className="text-sm text-amber-700 mb-4">
            Cette action est <strong>irréversible</strong> : elle calculera les redistributions, clôturera
            l&apos;exercice et enverra des notifications aux membres. Êtes-vous certain ?
          </p>
          {execError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{execError}</p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleExecute} isLoading={executeCassation.isPending}>
              Confirmer la cassation
            </Button>
          </div>
        </div>
      )}

      {noCassationFy ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Aucun exercice en phase de cassation ou clôturé.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : isError || !record ? (
        cassationFy?.status === 'CASSATION' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            La cassation n&apos;a pas encore été exécutée pour l&apos;exercice <strong>{cassationFy.label}</strong>.
          </div>
        ) : null
      ) : (
        <>
          {/* KPI résumé */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Capital restitué', value: `${parseFloat(record.totalSavingsReturned).toLocaleString('fr-FR')} XAF` },
              { label: 'Intérêts restitués', value: `${parseFloat(record.totalInterestReturned).toLocaleString('fr-FR')} XAF` },
              { label: 'Total distribué', value: `${parseFloat(record.totalDistributed).toLocaleString('fr-FR')} XAF` },
              { label: 'Membres', value: String(record.memberCount) },
              { label: 'Prêts (N+1)', value: String(record.carryoverCount ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="font-semibold text-gray-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
              {record.notes}
            </div>
          )}

          {/* Redistributions par membre */}
          {record.redistributions && record.redistributions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-800">Redistributions par membre</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Capital</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Intérêts</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {record.redistributions.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-800 font-medium">
                        {r.membership?.profile
                          ? `${r.membership.profile.lastName} ${r.membership.profile.firstName}`
                          : r.membershipId}
                        {r.membership?.profile?.memberCode && (
                          <span className="ml-1 text-xs text-gray-400">({r.membership.profile.memberCode})</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                        {parseFloat(r.savingsAmount).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-blue-700">
                        {parseFloat(r.interestAmount).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {parseFloat(r.totalReturned).toLocaleString('fr-FR')} XAF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Parts institutionnelles */}
          {record.participantShares && record.participantShares.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-base font-semibold text-gray-800">Parts institutionnelles</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-600">Entité</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Principal</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Intérêts</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {record.participantShares.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-800">{p.participantType}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                        {parseFloat(p.principalAmount).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-blue-700">
                        {parseFloat(p.interestEarned).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {parseFloat(p.totalDistributed).toLocaleString('fr-FR')} XAF
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
