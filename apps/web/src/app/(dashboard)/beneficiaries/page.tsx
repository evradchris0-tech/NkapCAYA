'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import { Skeleton } from '@components/ui/Skeleton';
import Modal from '@components/ui/Modal';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import { Trash2, FileText, Plus, X } from 'lucide-react';
import { useBeneficiarySchedule, useAssignSlot, useMarkDelivered, useAddSlotToSession, useRemoveSlot } from '@lib/hooks/useBeneficiaries';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useLoansByMembership } from '@lib/hooks/useLoans';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole, LoanStatus } from '@/types/domain.types';
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

/** Modale détail bénéficiaire : calcul brut / retenues / net */
function BeneficiaryDetailModal({
  slot,
  onClose,
  onDelivery,
}: {
  slot: BeneficiarySlot;
  onClose: () => void;
  onDelivery: (slotId: string, amount: number) => void;
}) {
  const { data: loans } = useLoansByMembership(slot.membershipId ?? '');
  const activeLoans = useMemo(
    () => (loans ?? []).filter(
      (l) => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.PARTIALLY_REPAID,
    ),
    [loans],
  );

  const [tontineAmount, setTontineAmount] = useState(slot.amountDelivered !== '0' ? slot.amountDelivered : '');
  const [extraRows, setExtraRows] = useState<{ label: string; amount: string }[]>([]);
  const [retentionRows, setRetentionRows] = useState<{ label: string; amount: string }[]>([]);

  const totalEntrees = useMemo(() => {
    const t = parseFloat(tontineAmount || '0');
    const extras = extraRows.reduce((s, r) => s + parseFloat(r.amount || '0'), 0);
    return t + extras;
  }, [tontineAmount, extraRows]);

  const totalPrets = useMemo(
    () => activeLoans.reduce((s, l) => s + parseFloat(l.outstandingBalance || '0'), 0),
    [activeLoans],
  );

  const totalRetentions = useMemo(() => {
    const manual = retentionRows.reduce((s, r) => s + parseFloat(r.amount || '0'), 0);
    return totalPrets + manual;
  }, [totalPrets, retentionRows]);

  const net = totalEntrees - totalRetentions;

  const memberName = slot.membership?.profile
    ? `${slot.membership.profile.lastName} ${slot.membership.profile.firstName}`
    : `Slot #${slot.slotIndex}`;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Détail bénéficiaire — ${memberName}`}
      size="md"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
          {slot.status === 'ASSIGNED' && (
            <Button
              onClick={() => { onDelivery(slot.id, net > 0 ? net : totalEntrees); onClose(); }}
            >
              Marquer livré ({net > 0 ? net.toLocaleString('fr-FR') : totalEntrees.toLocaleString('fr-FR')} XAF)
            </Button>
          )}
        </>
      )}
    >
      <div className="space-y-5 text-sm">
        {/* Entrées */}
        <div>
          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Entrées</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex-1 text-gray-600">Tontine (montant brut)</span>
              <input
                type="number"
                min="0"
                value={tontineAmount}
                onChange={(e) => setTontineAmount(e.target.value)}
                className="w-36 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-xs text-gray-400 w-6">XAF</span>
            </div>
            {extraRows.map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Libellé"
                  value={row.label}
                  onChange={(e) => setExtraRows((prev) => prev.map((r, j) => j === i ? { ...r, label: e.target.value } : r))}
                  className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={row.amount}
                  onChange={(e) => setExtraRows((prev) => prev.map((r, j) => j === i ? { ...r, amount: e.target.value } : r))}
                  className="w-36 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button onClick={() => setExtraRows((prev) => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 w-6">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setExtraRows((prev) => [...prev, { label: '', amount: '' }])}
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Ajouter une entrée
            </button>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 font-semibold text-emerald-700">
            <span>Total Entrées</span>
            <span className="tabular-nums">{totalEntrees.toLocaleString('fr-FR')} XAF</span>
          </div>
        </div>

        {/* Retenues */}
        <div>
          <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-2">Retenues</h3>
          <div className="space-y-2">
            {activeLoans.length > 0 ? (
              activeLoans.map((l) => (
                <div key={l.id} className="flex justify-between text-gray-600 py-1 border-b border-gray-50">
                  <span>Prêt en cours (solde restant)</span>
                  <span className="tabular-nums text-rose-600 font-medium">
                    {parseFloat(l.outstandingBalance).toLocaleString('fr-FR')} XAF
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Aucun prêt actif</p>
            )}
            {retentionRows.map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Libellé (ex: Secours, Projet)"
                  value={row.label}
                  onChange={(e) => setRetentionRows((prev) => prev.map((r, j) => j === i ? { ...r, label: e.target.value } : r))}
                  className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={row.amount}
                  onChange={(e) => setRetentionRows((prev) => prev.map((r, j) => j === i ? { ...r, amount: e.target.value } : r))}
                  className="w-36 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button onClick={() => setRetentionRows((prev) => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 w-6">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setRetentionRows((prev) => [...prev, { label: '', amount: '' }])}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Ajouter une retenue
            </button>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 font-semibold text-rose-700">
            <span>Total Retenues</span>
            <span className="tabular-nums">{totalRetentions.toLocaleString('fr-FR')} XAF</span>
          </div>
        </div>

        {/* Net */}
        <div className={`flex justify-between p-3 rounded-xl font-bold text-base ${net >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          <span>Net à percevoir</span>
          <span className="tabular-nums">{net.toLocaleString('fr-FR')} XAF</span>
        </div>
      </div>
    </Modal>
  );
}

export default function BeneficiariesPage() {
  const { data: currentUser } = useCurrentUser();
  const { selectedFyId, fiscalYears, setSelectedFyId } = useFiscalYearContext();
  const { data: memberships } = useFiscalYearMemberships(selectedFyId);
  const { data: schedule, isLoading } = useBeneficiarySchedule(selectedFyId, fiscalYears?.find(fy => fy.id === selectedFyId)?.status);
  const assignSlot = useAssignSlot(selectedFyId);
  const markDelivered = useMarkDelivered(selectedFyId);
  const addSlot = useAddSlotToSession(selectedFyId);
  const removeSlot = useRemoveSlot(selectedFyId);

  const [assigningSlotId, setAssigningSlotId] = useState<string | null>(null);
  const [selectedMembership, setSelectedMembership] = useState('');
  const [deliverySlotId, setDeliverySlotId] = useState<string | null>(null);
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [detailSlot, setDetailSlot] = useState<BeneficiarySlot | null>(null);

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

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-6 py-2.5 font-medium text-gray-500 text-xs">Slot</th>
                        <th className="text-left px-6 py-2.5 font-medium text-gray-500 text-xs">Bénéficiaire</th>
                        <th className="text-right px-6 py-2.5 font-medium text-gray-500 text-xs">Montant livré</th>
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
                            {slot.membershipId && (
                              <button
                                title="Détail brut / retenues / net"
                                onClick={() => setDetailSlot(slot)}
                                className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors mr-1"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>
                            )}
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
                    {slots.some((s) => parseFloat(s.amountDelivered || '0') > 0) && (
                      <tfoot className="border-t border-gray-200 bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-6 py-2.5 text-xs font-bold text-gray-700">Total</td>
                          <td className="px-6 py-2.5 text-right tabular-nums font-bold text-gray-900 text-xs">
                            {slots.reduce((sum, s) => sum + parseFloat(s.amountDelivered || '0'), 0).toLocaleString('fr-FR')} XAF
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Modale détail brut/retenues/net */}
      {detailSlot && (
        <BeneficiaryDetailModal
          slot={detailSlot}
          onClose={() => setDetailSlot(null)}
          onDelivery={(slotId, amount) => {
            setDeliverySlotId(slotId);
            setDeliveryAmount(String(amount));
          }}
        />
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
