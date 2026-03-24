'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import { useBeneficiarySchedule, useAssignSlot, useMarkDelivered } from '@lib/hooks/useBeneficiaries';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { BeneficiaryStatus } from '@/types/api.types';
import { Skeleton } from '@components/ui/Skeleton';

const STATUS_LABELS: Record<BeneficiaryStatus, string> = {
  UNASSIGNED: 'Non désigné',
  ASSIGNED: 'Désigné',
  DELIVERED: 'Livré',
};

const STATUS_COLORS: Record<BeneficiaryStatus, string> = {
  UNASSIGNED: 'bg-gray-100 text-gray-500',
  ASSIGNED: 'bg-yellow-100 text-yellow-700',
  DELIVERED: 'bg-green-100 text-green-700',
};

export default function BeneficiariesPage() {
  const { data: currentUser } = useCurrentUser();
  const { selectedFyId, selectedFy, fiscalYears, setSelectedFyId } = useFiscalYearContext();
  const { data: memberships } = useFiscalYearMemberships(selectedFyId);
  const { data: schedule, isLoading } = useBeneficiarySchedule(selectedFyId);
  const assignSlot = useAssignSlot(selectedFyId);
  const markDelivered = useMarkDelivered(selectedFyId);

  const [assigningSlotId, setAssigningSlotId] = useState<string | null>(null);
  const [selectedMembership, setSelectedMembership] = useState('');

  const canAssign =
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

  const canDeliver =
    canAssign || currentUser?.role === BureauRole.TRESORIER;

  const handleAssign = async (slotId: string) => {
    if (!selectedMembership) return;
    await assignSlot.mutateAsync({ slotId, membershipId: selectedMembership });
    setAssigningSlotId(null);
    setSelectedMembership('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bénéficiaires"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Bénéficiaires' }]}
      />

      {/* Sélecteur exercice */}
      {fiscalYears && fiscalYears.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 shrink-0">Exercice :</label>
          <select
            value={selectedFyId}
            onChange={(e) => setSelectedFyId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>{fy.label} — {fy.status}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      ) : !selectedFyId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Sélectionnez un exercice fiscal.
        </div>
      ) : !schedule || !schedule.slots || schedule.slots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Aucun tableau de rotation disponible. L&apos;exercice doit être actif et les membres inscrits.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Tableau de rotation</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Mois</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Slot</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Bénéficiaire</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Statut</th>
                <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedule.slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-700">M{slot.month}</td>
                  <td className="px-6 py-3 text-gray-500">#{slot.slotIndex}</td>
                  <td className="px-6 py-3">
                    {slot.membership?.profile ? (
                      <span className="text-gray-900 font-medium">
                        {slot.membership.profile.lastName} {slot.membership.profile.firstName}
                      </span>
                    ) : assigningSlotId === slot.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMembership}
                          onChange={(e) => setSelectedMembership(e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                          aria-label="Sélectionner un membre"
                        >
                          <option value="">Choisir…</option>
                          {memberships?.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.profile?.lastName} {m.profile?.firstName}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAssign(slot.id)}
                          isLoading={assignSlot.isPending}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setAssigningSlotId(null); setSelectedMembership(''); }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Non désigné</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">
                    {parseFloat(slot.amountDelivered).toLocaleString('fr-FR')} XAF
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[slot.status]}`}>
                      {STATUS_LABELS[slot.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    {slot.status === 'UNASSIGNED' && canAssign && assigningSlotId !== slot.id && (
                      <Button size="sm" variant="secondary" onClick={() => setAssigningSlotId(slot.id)}>
                        Désigner
                      </Button>
                    )}
                    {slot.status === 'ASSIGNED' && canDeliver && (
                      <Button
                        size="sm"
                        onClick={() => markDelivered.mutate(slot.id)}
                        isLoading={markDelivered.isPending}
                      >
                        Marquer livré
                      </Button>
                    )}
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
