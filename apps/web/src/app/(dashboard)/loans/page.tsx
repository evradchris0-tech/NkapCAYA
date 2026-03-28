'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Pagination from '@components/ui/Pagination';
import { Skeleton, SkeletonRow } from '@components/ui/Skeleton';
import Select from '@components/ui/Select';
import { useLoansByMembership, useRequestLoan, useApproveLoan } from '@lib/hooks/useLoans';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { LoanStatus } from '@/types/domain.types';
import type { Membership } from '@/types/api.types';

// ── Constantes ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: 'En attente',
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

const PAGE_SIZE = 10;

// ── Schéma formulaire ─────────────────────────────────────────────────────────

const schema = z.object({
  membershipId: z.string().min(1, 'Membre requis'),
  amount: z.coerce.number().min(10000, 'Minimum 10 000 XAF'),
  dueBeforeDate: z.string().min(1, 'Date limite requise'),
  requestNotes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// ── Sous-composant : tableau des membres inscrits ─────────────────────────────

interface MembersTableProps {
  memberships: Membership[];
  isLoading: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
}

function MembersTable({ memberships, isLoading, selectedId, onSelect }: MembersTableProps) {
  const [page, setPage] = useState(1);

  const total = memberships.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced = memberships.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Membres inscrits</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Cliquez sur un membre pour voir ses prêts
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
              <th className="text-left px-6 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Code</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Nombre de parts</th>
              <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
              <th className="px-6 py-3"><span className="sr-only">Voir prêts</span></th>
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
              : sliced.map((m, index) => {
                  const fullName = m.profile
                    ? `${m.profile.lastName} ${m.profile.firstName}`
                    : '—';
                  const sharesCount = m.shareCommitment?.sharesCount ?? '—';
                  const isSelected = m.id === selectedId;

                  return (
                    <tr
                      key={m.id}
                      onClick={() => onSelect(isSelected ? '' : m.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-l-2 border-l-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-3 text-gray-400 text-xs tabular-nums">{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-800">{fullName}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                        {m.profile?.memberCode ?? '—'}
                      </td>
                      <td className="px-6 py-3 tabular-nums text-gray-700">
                        {sharesCount === '—' ? '—' : `${sharesCount} part${Number(sharesCount) > 1 ? 's' : ''}`}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.enrollmentType === 'NEW'
                            ? 'bg-emerald-100 text-emerald-700'
                            : m.enrollmentType === 'RETURNING'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {m.enrollmentType === 'NEW'
                            ? 'Nouveau'
                            : m.enrollmentType === 'RETURNING'
                            ? 'Ré-inscrit'
                            : 'En cours'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isSelected ? 'Sélectionné ✓' : 'Voir prêts →'}
                        </span>
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

// ── Amortissement ─────────────────────────────────────────────────────────────

function computeAmortization(balance: number, rate: number, months: number, payment: number) {
  const rows = [];
  let b = balance;
  for (let m = 1; m <= months; m++) {
    const interest = b * rate;
    const total = b + interest;
    const paid = Math.min(payment, total);
    const newBalance = Math.max(0, total - payment);
    rows.push({ month: m, balanceStart: b, interest, total, payment: paid, balanceEnd: newBalance });
    b = newBalance;
    if (b <= 0) break;
  }
  return rows;
}

function recommendedPayment(balance: number, rate: number, months: number): number {
  if (months <= 0) return balance;
  if (rate <= 0) return balance / months;
  return (balance * rate) / (1 - Math.pow(1 + rate, -months));
}

interface AmortizationPanelProps {
  balance: number;
  rate: number;
  dueBeforeDate: string;
}

function AmortizationPanel({ balance, rate, dueBeforeDate }: AmortizationPanelProps) {
  const today = new Date();
  const due = new Date(dueBeforeDate);
  const defaultMonths = Math.max(1, Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const [months, setMonths] = useState(defaultMonths);

  const payment = recommendedPayment(balance, rate, months);
  const rows = computeAmortization(balance, rate, months, payment);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const totalPaid = rows.reduce((s, r) => s + r.payment, 0);
  const isPaidOff = rows[rows.length - 1]?.balanceEnd === 0;

  const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-blue-100 p-5 space-y-4">
      {/* Titre */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-blue-900">Simulation de remboursement</h4>
        <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
          Taux : {(rate * 100).toFixed(0)} %/mois
        </span>
      </div>

      {/* Slider mois */}
      <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-medium">Durée du remboursement</span>
          <span className="text-lg font-bold text-blue-700 tabular-nums">{months} mois</span>
        </div>
        <input
          type="range"
          min={1}
          max={36}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full h-2 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1 mois</span>
          <span className="text-blue-400 font-medium">
            Date limite : {new Date(dueBeforeDate).toLocaleDateString('fr-FR')}
            {' '}({defaultMonths} mois)
          </span>
          <span>36 mois</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Mensualité',
            value: `${fmt(payment)} XAF`,
            sub: 'capital + intérêts',
            color: 'text-blue-700',
            bg: 'bg-white border-blue-100',
          },
          {
            label: 'Total intérêts',
            value: `${fmt(totalInterest)} XAF`,
            sub: `sur ${rows.length} mois`,
            color: 'text-amber-600',
            bg: 'bg-white border-amber-100',
          },
          {
            label: 'Total remboursé',
            value: `${fmt(totalPaid)} XAF`,
            sub: isPaidOff ? '✓ Solde clôturé' : `solde résiduel`,
            color: isPaidOff ? 'text-green-700' : 'text-gray-700',
            bg: `${isPaidOff ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`,
          },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`rounded-xl border p-3 shadow-sm ${bg}`}>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Table mois par mois */}
      <div className="overflow-x-auto rounded-xl border border-blue-100 shadow-sm">
        <table className="w-full text-xs bg-white">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left px-3 py-2 font-semibold rounded-tl-xl">Mois</th>
              <th className="text-right px-3 py-2 font-semibold">Solde début</th>
              <th className="text-right px-3 py-2 font-semibold text-amber-200">+ Intérêts</th>
              <th className="text-right px-3 py-2 font-semibold text-green-200">− Mensualité</th>
              <th className="text-right px-3 py-2 font-semibold rounded-tr-xl">Solde fin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50">
            {rows.map((r, i) => (
              <tr
                key={r.month}
                className={`transition-colors ${
                  r.balanceEnd === 0
                    ? 'bg-green-50'
                    : i % 2 === 0
                    ? 'bg-white'
                    : 'bg-blue-50/30'
                }`}
              >
                <td className="px-3 py-2 font-medium text-blue-800">M+{r.month}</td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700">{fmt(r.balanceStart)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-amber-600 font-medium">+{fmt(r.interest)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-green-700 font-medium">−{fmt(r.payment)}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${r.balanceEnd === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {fmt(r.balanceEnd)}{r.balanceEnd === 0 ? ' ✓' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-blue-400 text-center">
        Simulation indicative — basée sur le solde actuel de{' '}
        <strong>{fmt(balance)} XAF</strong>. Les remboursements réels modifieront les montants.
      </p>
    </div>
  );
}

// ── Sous-composant : liste des prêts du membre sélectionné ────────────────────

interface MemberLoansProps {
  membershipId: string;
  displayName: string;
  isPresident: boolean;
  isReadOnly: boolean;
}

function MemberLoans({ membershipId, displayName, isPresident, isReadOnly }: MemberLoansProps) {
  const { data: loans, isLoading } = useLoansByMembership(membershipId);
  const approveLoan = useApproveLoan();
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-base font-semibold text-gray-800">
          Prêts — <span className="text-blue-700">{displayName}</span>
        </h2>
      </div>

      {isLoading ? (
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
          </tbody>
        </table>
      ) : !loans || loans.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          Aucun prêt enregistré pour ce membre.
        </div>
      ) : (
        <div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Taux mensuel</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Solde restant</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Date limite</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <React.Fragment key={loan.id}>
                  <tr className="hover:bg-gray-50 transition border-b border-gray-100">
                    <td className="px-6 py-3 font-medium tabular-nums">
                      {parseFloat(loan.principalAmount).toLocaleString('fr-FR')} XAF
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {(parseFloat(loan.monthlyRate) * 100).toFixed(0)} %
                    </td>
                    <td className="px-6 py-3 tabular-nums text-gray-700">
                      {parseFloat(loan.outstandingBalance).toLocaleString('fr-FR')} XAF
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(loan.dueBeforeDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[loan.status]}`}>
                        {STATUS_LABELS[loan.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {(loan.status === 'ACTIVE' || loan.status === 'PARTIALLY_REPAID') && (
                          <button
                            onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            {expandedLoanId === loan.id ? 'Masquer simulation' : 'Simuler remboursement'}
                          </button>
                        )}
                        {loan.status === 'PENDING' && isPresident && !isReadOnly && (
                          <Button
                            size="sm"
                            onClick={() => approveLoan.mutate(loan.id)}
                            isLoading={approveLoan.isPending}
                          >
                            Approuver
                          </Button>
                        )}
                        <Link
                          href={`/loans/${loan.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Voir →
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {expandedLoanId === loan.id && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <AmortizationPanel
                          balance={parseFloat(loan.outstandingBalance)}
                          rate={parseFloat(loan.monthlyRate)}
                          dueBeforeDate={loan.dueBeforeDate}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function LoansPage() {
  const { data: currentUser } = useCurrentUser();
  const { selectedFyId, selectedFy, isReadOnly } = useFiscalYearContext();

  const { data: memberships = [], isLoading: loadingMemberships } =
    useFiscalYearMemberships(selectedFyId);

  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [showForm, setShowForm] = useState(false);

  const requestLoan = useRequestLoan();

  const isTresorier =
    currentUser?.role === BureauRole.TRESORIER ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

  const isPresident =
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { dueBeforeDate: selectedFy?.loanDueDate?.substring(0, 10) ?? '' },
    });

  const onSubmit = async (data: FormValues) => {
    try {
      await requestLoan.mutateAsync(data);
      reset();
      setShowForm(false);
    } catch {
      setError('root', { message: 'Erreur lors de la demande de prêt.' });
    }
  };

  // Nom du membre sélectionné
  const selectedMembership = memberships.find((m) => m.id === selectedMembershipId);
  const selectedDisplayName = selectedMembership?.profile
    ? `${selectedMembership.profile.lastName} ${selectedMembership.profile.firstName}`
    : selectedMembershipId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Prêts' }]}
        action={
          isTresorier && selectedFy && !isReadOnly ? (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              + Demander un prêt
            </Button>
          ) : undefined
        }
      />

      {/* Formulaire demande de prêt */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl animate-slide-up">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Nouvelle demande de prêt</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="loan-membership" className="text-sm font-medium text-gray-700">
                Membre
              </label>
              {loadingMemberships ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Select
                  id="loan-membership"
                  {...register('membershipId')}
                  error={errors.membershipId?.message}
                >
                  <option value="">Sélectionner…</option>
                  {memberships.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <Input
              label="Montant (XAF)"
              type="number"
              placeholder="100000"
              {...register('amount')}
              error={errors.amount?.message}
            />
            <Input
              label="Date limite de remboursement"
              type="date"
              {...register('dueBeforeDate')}
              error={errors.dueBeforeDate?.message}
            />
            <Input
              label="Objet du prêt (optionnel)"
              placeholder="Raison de la demande"
              {...register('requestNotes')}
            />

            {errors.root && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {errors.root.message}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Soumettre la demande
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Guard : pas d'exercice */}
      {!selectedFyId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
          Aucun exercice fiscal sélectionné.
        </div>
      )}

      {selectedFyId && (
        <>
          {/* Filtre rapide par membre (select) + indicateur exercice */}
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
                    {m.profile?.lastName} {m.profile?.firstName}
                  </option>
                ))}
              </Select>
            )}
            {selectedMembershipId && (
              <button
                onClick={() => setSelectedMembershipId('')}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Effacer le filtre
              </button>
            )}
            {selectedFy && (
              <span className="ml-auto text-xs text-gray-400">
                Exercice : <span className="font-medium text-gray-600">{selectedFy.label}</span>
              </span>
            )}
          </div>

          {/* Tableau des membres ou détail prêts */}
          {selectedMembershipId ? (
            <MemberLoans
              membershipId={selectedMembershipId}
              displayName={selectedDisplayName}
              isPresident={isPresident}
              isReadOnly={isReadOnly}
            />
          ) : (
            <MembersTable
              memberships={memberships}
              isLoading={loadingMemberships}
              selectedId={selectedMembershipId}
              onSelect={setSelectedMembershipId}
            />
          )}
        </>
      )}
    </div>
  );
}
