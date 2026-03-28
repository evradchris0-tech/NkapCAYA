'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import { Skeleton } from '@components/ui/Skeleton';
import Modal from '@components/ui/Modal';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import { Trash2 } from 'lucide-react';
import { useBeneficiarySchedule, useAssignSlot, useMarkDelivered, useAddSlotToSession, useRemoveSlot } from '@lib/hooks/useBeneficiaries';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { BeneficiarySlot, BeneficiaryStatus } from '@/types/api.types';

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
  const { selectedFyId, fiscalYears, setSelectedFyId } = useFiscalYearContext();
  const { data: memberships } = useFiscalYearMemberships(selectedFyId);
  const { data: schedule, isLoading } = useBeneficiarySchedule(selectedFyId);
  const assignSlot = useAssignSlot(selectedFyId);
  const markDelivered = useMarkDelivered(selectedFyId);
  const addSlot = useAddSlotToSession(selectedFyId);
  const removeSlot = useRemoveSlot(selectedFyId);

  const [assigningSlotId, setAssigningSlotId] = useState<string | null>(null);
  const [selectedMembership, setSelectedMembership] = useState('');
  const [deliverySlotId, setDeliverySlotId] = useState<string | null>(null);
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);

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

  // Grouper les slots par sessionId
  const slotsBySession = (schedule?.slots ?? []).reduce<Record<string, BeneficiarySlot[]>>(
    (acc, slot) => {
      if (!acc[slot.sessionId]) acc[slot.sessionId] = [];
      acc[slot.sessionId].push(slot);
      return acc;
    },
    {},
  );
  const sessionGroups = Object.entries(slotsBySession).sort(([, a], [, b]) => a[0].month - b[0].month);

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
          <Select
            value={selectedFyId}
            onChange={(e) => setSelectedFyId(e.target.value)}
            className="w-64"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>{fy.label} — {fy.status}</option>
            ))}
          </Select>
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
      ) : sessionGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
          Aucun tableau de rotation disponible. L&apos;exercice doit être actif et les membres inscrits.
        </div>
      ) : (
        <div className="space-y-4">
          {sessionGroups.map(([sessionId, slots]) => {
            const month = slots[0].month;
            const deliveredCount = slots.filter((s) => s.status === 'DELIVERED').length;
            const totalDelivered = slots.filter((s) => s.status === 'DELIVERED').reduce((sum, s) => sum + parseFloat(s.amountDelivered || '0'), 0);

            return (
              <div key={sessionId} className="bg-white rounded-xl border border-gray-200 overflow-visible relative">
                {/* En-tête session */}
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-gray-800">Session — Mois {month}</h2>
                    {deliveredCount > 0 && (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        {deliveredCount} livré{deliveredCount > 1 ? 's' : ''} · {totalDelivered.toLocaleString('fr-FR')} XAF
                      </span>
                    )}
                  </div>
                  {canAssign && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => addSlot.mutate(sessionId)}
                      isLoading={addSlot.isPending}
                    >
                      + Bénéficiaire
                    </Button>
                  )}
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-6 py-2.5 font-medium text-gray-500 text-xs">Slot</th>
                      <th className="text-left px-6 py-2.5 font-medium text-gray-500 text-xs">Bénéficiaire</th>
                      <th className="text-right px-6 py-2.5 font-medium text-gray-500 text-xs">Montant</th>
                      <th className="text-left px-6 py-2.5 font-medium text-gray-500 text-xs">Statut</th>
                      <th className="px-6 py-2.5"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slots.map((slot) => (
                      <tr key={slot.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-500 text-xs font-mono">#{slot.slotIndex}</td>
                        <td className="px-6 py-3">
                          {assigningSlotId === slot.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={selectedMembership}
                                onChange={(e) => setSelectedMembership(e.target.value)}
                                aria-label="Sélectionner un membre"
                                className="w-48"
                                size="sm"
                              >
                                <option value="">Choisir…</option>
                                {memberships?.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.profile?.lastName} {m.profile?.firstName}
                                  </option>
                                ))}
                              </Select>
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
                          ) : slot.membership?.profile ? (
                            <span className="text-gray-900 font-medium flex items-center gap-1.5">
                              {slot.membership.profile.lastName} {slot.membership.profile.firstName}
                              {slot.isHost && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Hôte</span>
                              )}
                            </span>
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
                          {['UNASSIGNED', 'ASSIGNED'].includes(slot.status) && canAssign && assigningSlotId !== slot.id && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setAssigningSlotId(slot.id);
                                setSelectedMembership(slot.membershipId || '');
                              }}
                              className="mr-2"
                            >
                              {slot.status === 'ASSIGNED' ? 'Modifier' : 'Désigner'}
                            </Button>
                          )}
                          {slot.status !== 'DELIVERED' && canAssign && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingSlotId(slot.id)}
                              title="Retirer ce bénéficiaire"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {slot.status === 'ASSIGNED' && canDeliver && (
                            <Button
                              size="sm"
                              className="ml-2"
                              onClick={() => {
                                setDeliverySlotId(slot.id);
                                setDeliveryAmount('');
                              }}
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
            );
          })}
        </div>
      )}
      {/* Modal confirmation remise */}
      <Modal
        isOpen={Boolean(deliverySlotId)}
        onClose={() => setDeliverySlotId(null)}
        title="Confirmer la remise"
        size="sm"
        footer={(
          <>
            <Button
              variant="secondary"
              onClick={() => setDeliverySlotId(null)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                const amount = deliveryAmount ? parseFloat(deliveryAmount) : undefined;
                markDelivered.mutate({ slotId: deliverySlotId!, amount });
                setDeliverySlotId(null);
              }}
              isLoading={markDelivered.isPending}
            >
              Confirmer
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Saisir le montant perçu par le bénéficiaire pour ce pot.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Montant (XAF)</label>
            <input
              type="number"
              placeholder="0"
              value={deliveryAmount}
              onChange={(e) => setDeliveryAmount(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Confirmation suppression slot */}
      <ConfirmDialog
        isOpen={Boolean(deletingSlotId)}
        title="Retirer le bénéficiaire"
        message="Êtes-vous sûr de vouloir supprimer ce slot de bénéficiaire ? Cette action est irréversible."
        confirmLabel="Retirer"
        variant="danger"
        isLoading={removeSlot.isPending}
        onConfirm={async () => {
          await removeSlot.mutateAsync(deletingSlotId!);
          setDeletingSlotId(null);
        }}
        onCancel={() => setDeletingSlotId(null)}
      />
    </div>
  );
}
