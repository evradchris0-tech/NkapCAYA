'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import ChartCard from '@components/ui/ChartCard';
import { useLoan, useApplyRepayment } from '@lib/hooks/useLoans';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { LoanStatus } from '@/types/domain.types';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';

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

  const pctNum = parseFloat(pct);

  // Données pour l'area chart (amortissement)
  const accrualChartData = (loan.monthlyAccruals ?? []).map((a) => ({
    label: `M${a.month}`,
    'Solde restant':  parseFloat(a.balanceAtMonthEnd),
    'Intérêts':       parseFloat(a.interestAccrued),
    'Remboursé':      parseFloat(a.repaymentReceived),
  }));

  // Données barres empilées remboursements
  const repayChartData = (loan.repayments ?? []).map((r, i) => ({
    label: `R${i + 1}`,
    Principal: parseFloat(r.principalPart),
    Intérêts:  parseFloat(r.interestPart),
  }));

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

      {/* Barre de progression remboursement */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression du remboursement</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: pctNum >= 100 ? '#10b981' : pctNum >= 50 ? '#3b82f6' : '#f59e0b' }}>
            {pct} %
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pctNum, 100)}%`,
              background: pctNum >= 100 ? '#10b981' : pctNum >= 50 ? '#3b82f6' : '#f59e0b',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>{parseFloat(loan.totalRepaid).toLocaleString('fr-FR')} XAF remboursé</span>
          <span>{parseFloat(loan.outstandingBalance).toLocaleString('fr-FR')} XAF restant</span>
        </div>
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

      {/* ── Graphes analytiques ── */}
      {accrualChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Area : évolution du solde restant */}
          <ChartCard title="Évolution du solde restant" subtitle="Par mois d'amortissement">
            <div className="h-52 px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accrualChartData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('fr-FR')} XAF`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="Solde restant" stroke="#3b82f6" strokeWidth={2} fill="url(#balGrad)" dot={false} />
                  <Area type="monotone" dataKey="Intérêts"      stroke="#f59e0b" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Barres empilées : décomposition des remboursements */}
          {repayChartData.length > 0 && (
            <ChartCard title="Décomposition des remboursements" subtitle="Principal vs Intérêts">
              <div className="h-52 px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repayChartData} barSize={20} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={42} />
                    <Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('fr-FR')} XAF`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={7} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Intérêts"  stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          )}
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
