'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { useLoansByMembership, useRequestLoan, useApproveLoan } from '@lib/hooks/useLoans';
import { useFiscalYears, useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { LoanStatus } from '@/types/domain.types';

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

const schema = z.object({
  membershipId: z.string().min(1, 'Membre requis'),
  amount: z.coerce.number().min(10000, 'Minimum 10 000 XAF'),
  dueBeforeDate: z.string().min(1, 'Date limite requise'),
  requestNotes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function LoansPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: fiscalYears } = useFiscalYears();
  const activeFy = fiscalYears?.find((f) => f.status === 'ACTIVE');
  const { data: memberships } = useFiscalYearMemberships(activeFy?.id ?? '');

  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const { data: loans } = useLoansByMembership(selectedMembershipId);

  const requestLoan = useRequestLoan();
  const approveLoan = useApproveLoan();
  const [showForm, setShowForm] = useState(false);

  const isTresorier = currentUser?.role === BureauRole.TRESORIER || currentUser?.role === BureauRole.SUPER_ADMIN;
  const isPresident = currentUser?.role === BureauRole.PRESIDENT || currentUser?.role === BureauRole.SUPER_ADMIN;

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { dueBeforeDate: activeFy?.loanDueDate?.substring(0, 10) ?? '' },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Prêts' }]}
        action={
          isTresorier && activeFy ? (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              + Demander un prêt
            </Button>
          ) : undefined
        }
      />

      {/* Formulaire demande de prêt */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Nouvelle demande de prêt</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="loan-membership" className="text-sm font-medium text-gray-700">Membre</label>
              <select
                id="loan-membership"
                {...register('membershipId')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner…</option>
                {memberships?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
                  </option>
                ))}
              </select>
              {errors.membershipId && <p className="text-xs text-red-500">{errors.membershipId.message}</p>}
            </div>

            <Input label="Montant (XAF)" type="number" placeholder="100000" {...register('amount')} error={errors.amount?.message} />
            <Input label="Date limite de remboursement" type="date" {...register('dueBeforeDate')} error={errors.dueBeforeDate?.message} />
            <Input label="Objet du prêt (optionnel)" placeholder="Raison de la demande" {...register('requestNotes')} />

            {errors.root && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors.root.message}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">Soumettre la demande</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtre par membre */}
      <div className="flex items-center gap-3">
        <label htmlFor="member-filter" className="text-sm font-medium text-gray-700">Filtrer par membre :</label>
        <select
          id="member-filter"
          value={selectedMembershipId}
          onChange={(e) => setSelectedMembershipId(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">Tous les membres</option>
          {memberships?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.profile?.lastName} {m.profile?.firstName}
            </option>
          ))}
        </select>
      </div>

      {/* Liste prêts */}
      {!selectedMembershipId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Sélectionnez un membre pour voir ses prêts.
        </div>
      ) : !loans || loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Aucun prêt pour ce membre.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
            <tbody className="divide-y divide-gray-100">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition">
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
                  <td className="px-6 py-3 text-right flex items-center gap-2 justify-end">
                    {loan.status === 'PENDING' && isPresident && (
                      <Button
                        size="sm"
                        onClick={() => approveLoan.mutate(loan.id)}
                        isLoading={approveLoan.isPending}
                      >
                        Approuver
                      </Button>
                    )}
                    <Link href={`/loans/${loan.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
