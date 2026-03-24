'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { useLoan, useApplyRepayment } from '@lib/hooks/useLoans';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { LoanStatus } from '@/types/domain.types';

interface Props { params: { id: string } }

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: 'En attente d\'approbation',
  ACTIVE: 'En cours',
  PARTIALLY_REPAID: 'Partiellement remboursé',
  CLOSED: 'Clôturé',
};

const STATUS_COLORS: Record<LoanStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PARTIALLY_REPAID: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function LoanDetailPage({ params }: Props) {
  const { data: loan, isLoading, isError } = useLoan(params.id);
  const { data: currentUser } = useCurrentUser();
  const applyRepayment = useApplyRepayment(params.id);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayError, setRepayError] = useState<string | null>(null);

  const isTresorier = currentUser?.role === BureauRole.TRESORIER || currentUser?.role === BureauRole.SUPER_ADMIN;

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepayError(null);
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) { setRepayError('Montant invalide.'); return; }
    try {
      await applyRepayment.mutateAsync({ amount });
      setRepayAmount('');
    } catch {
      setRepayError('Erreur lors de l\'enregistrement du remboursement.');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Chargement…</div>;
  if (isError || !loan) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Prêt introuvable.</div>;

  const pct = parseFloat(loan.principalAmount) > 0
    ? ((parseFloat(loan.totalRepaid) / parseFloat(loan.principalAmount)) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détail du prêt"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Prêts', href: '/loans' }, { label: 'Détail' }]}
      />

      {/* Statut + progression */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Montant emprunté', value: `${parseFloat(loan.principalAmount).toLocaleString('fr-FR')} XAF` },
          { label: 'Solde restant', value: `${parseFloat(loan.outstandingBalance).toLocaleString('fr-FR')} XAF` },
          { label: 'Intérêts cumulés', value: `${parseFloat(loan.totalInterestAccrued).toLocaleString('fr-FR')} XAF` },
          { label: 'Remboursé', value: `${parseFloat(loan.totalRepaid).toLocaleString('fr-FR')} XAF (${pct} %)` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-semibold text-gray-900 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Infos générales */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800">Informations</h2>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status]}`}>
            {STATUS_LABELS[loan.status]}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Taux mensuel" value={`${(parseFloat(loan.monthlyRate) * 100).toFixed(0)} %`} />
          <InfoRow label="Date limite" value={new Date(loan.dueBeforeDate).toLocaleDateString('fr-FR')} />
          <InfoRow label="Demandé le" value={new Date(loan.requestedAt).toLocaleDateString('fr-FR')} />
          {loan.disbursedAt && <InfoRow label="Décaissé le" value={new Date(loan.disbursedAt).toLocaleDateString('fr-FR')} />}
          {loan.requestNotes && <InfoRow label="Objet" value={loan.requestNotes} />}
        </div>
      </div>

      {/* Remboursement */}
      {isTresorier && (loan.status === 'ACTIVE' || loan.status === 'PARTIALLY_REPAID') && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Enregistrer un remboursement</h2>
          <form onSubmit={handleRepay} className="flex items-end gap-3 max-w-sm">
            <Input
              label="Montant (XAF)"
              type="number"
              placeholder="50000"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
            />
            <Button type="submit" isLoading={applyRepayment.isPending} className="shrink-0">
              Enregistrer
            </Button>
          </form>
          {repayError && <p className="text-sm text-red-600 mt-2">{repayError}</p>}
        </div>
      )}

      {/* Historique remboursements */}
      {loan.repayments && loan.repayments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Historique des remboursements</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Date</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Total</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Principal</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Intérêts</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Solde après</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loan.repayments.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600">{new Date(r.recordedAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">{parseFloat(r.amount).toLocaleString('fr-FR')} XAF</td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-600">{parseFloat(r.principalPart).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-600">{parseFloat(r.interestPart).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-gray-500">{parseFloat(r.balanceAfter).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tableau amortissement */}
      {loan.monthlyAccruals && loan.monthlyAccruals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Tableau d&apos;amortissement</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Mois</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Solde début</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Intérêts</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Reçu</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Solde fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loan.monthlyAccruals.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">M{a.month}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{parseFloat(a.balanceAtMonthStart).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-orange-600">{parseFloat(a.interestAccrued).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-green-600">{parseFloat(a.repaymentReceived).toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">{parseFloat(a.balanceAtMonthEnd).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
