'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import { useRescueFundLedger, useRescueFundEvents, useRecordRescueEvent } from '@lib/hooks/useRescueFund';
import { useFiscalYears, useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { RescueEventType } from '@/types/api.types';

const EVENT_TYPE_LABELS: Record<RescueEventType, string> = {
  MEMBER_DEATH: 'Décès du membre',
  RELATIVE_DEATH: 'Décès d\'un proche',
  MARRIAGE: 'Mariage',
  BIRTH: 'Naissance',
  ILLNESS: 'Maladie',
  PROMOTION: 'Promotion',
};

const schema = z.object({
  beneficiaryMembershipId: z.string().min(1, 'Membre requis'),
  eventType: z.enum(['MEMBER_DEATH', 'RELATIVE_DEATH', 'MARRIAGE', 'BIRTH', 'ILLNESS', 'PROMOTION'] as const),
  eventDate: z.string().min(1, 'Date requise'),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function RescueFundPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: fiscalYears } = useFiscalYears();
  const activeFy = fiscalYears?.find((f) => f.status === 'ACTIVE');
  const { data: memberships } = useFiscalYearMemberships(activeFy?.id ?? '');
  const { data: ledger, isLoading: ledgerLoading } = useRescueFundLedger(activeFy?.id ?? '');
  const { data: events } = useRescueFundEvents(activeFy?.id ?? '');
  const recordEvent = useRecordRescueEvent(activeFy?.id ?? '');

  const [showForm, setShowForm] = useState(false);

  const canRecord =
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.VICE_PRESIDENT ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await recordEvent.mutateAsync(data);
      reset();
      setShowForm(false);
    } catch {
      setError('root', { message: 'Erreur lors de l\'enregistrement du décaissement.' });
    }
  };

  if (!activeFy) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Caisse de secours"
          breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Caisse de secours' }]}
        />
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Aucun exercice fiscal actif.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caisse de secours"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Caisse de secours' }]}
        action={
          canRecord ? (
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              + Enregistrer un décaissement
            </Button>
          ) : undefined
        }
      />

      {/* Formulaire décaissement */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Nouveau décaissement</h2>
          <p className="text-xs text-gray-500 mb-4">
            Le montant est automatiquement fixé selon le type d&apos;événement (défini dans la configuration).
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="rf-member" className="text-sm font-medium text-gray-700">Bénéficiaire</label>
              <select
                id="rf-member"
                {...register('beneficiaryMembershipId')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner…</option>
                {memberships?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
                  </option>
                ))}
              </select>
              {errors.beneficiaryMembershipId && (
                <p className="text-xs text-red-500">{errors.beneficiaryMembershipId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="rf-type" className="text-sm font-medium text-gray-700">Type d&apos;événement</label>
              <select
                id="rf-type"
                {...register('eventType')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner…</option>
                {(Object.keys(EVENT_TYPE_LABELS) as RescueEventType[]).map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
              {errors.eventType && (
                <p className="text-xs text-red-500">{errors.eventType.message}</p>
              )}
            </div>

            <Input
              label="Date de l'événement"
              type="date"
              {...register('eventDate')}
              error={errors.eventDate?.message}
            />
            <Input
              label="Description (optionnel)"
              placeholder="Précisions sur l'événement"
              {...register('description')}
            />

            {errors.root && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors.root.message}</p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Enregistrer
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* KPI solde */}
      {ledgerLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : ledger ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Solde actuel',
              value: `${parseFloat(ledger.totalBalance).toLocaleString('fr-FR')} XAF`,
            },
            {
              label: 'Objectif / membre',
              value: `${parseFloat(ledger.targetPerMember).toLocaleString('fr-FR')} XAF`,
            },
            {
              label: 'Minimum / membre',
              value: `${parseFloat(ledger.minimumPerMember).toLocaleString('fr-FR')} XAF`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="font-semibold text-gray-900 tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Historique événements */}
      {events && events.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Historique des décaissements</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(event.eventDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-3 text-gray-800 font-medium">
                    {EVENT_TYPE_LABELS[event.eventType]}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium text-red-600">
                    -{parseFloat(event.amount).toLocaleString('fr-FR')} XAF
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{event.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          Aucun décaissement enregistré pour cet exercice.
        </div>
      )}
    </div>
  );
}
