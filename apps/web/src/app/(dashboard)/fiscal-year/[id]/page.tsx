'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import {
  useFiscalYear,
  useFiscalYearMemberships,
  useActivateFiscalYear,
  useOpenCassation,
  useAddMember,
  useUpdateMembership,
  useUpdateFiscalYear,
  useDeleteFiscalYear,
  useCloseFiscalYear,
} from '@lib/hooks/useFiscalYear';
import { useMembers } from '@lib/hooks/useMembers';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { FiscalYearStatus } from '@/types/api.types';
import ChartCard from '@components/ui/ChartCard';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const STATUS_LABELS: Record<FiscalYearStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  CASSATION: 'Cassation',
  CLOSED: 'Clôturé',
  ARCHIVED: 'Archivé',
};

const STATUS_COLORS: Record<FiscalYearStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CASSATION: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-gray-100 text-gray-400',
};

interface Props {
  params: { id: string };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function FiscalYearDetailPage({ params }: Props) {
  const router = useRouter();
  const { data: fy, isLoading, isError } = useFiscalYear(params.id);
  const { data: memberships } = useFiscalYearMemberships(params.id);
  const { data: allMembers, isLoading: isMembersLoading } = useMembers({ limit: 100 });
  const { data: currentUser } = useCurrentUser();
  const activate = useActivateFiscalYear();
  const openCassation = useOpenCassation();
  const addMember = useAddMember(params.id);
  const updateMembership = useUpdateMembership(params.id);

  const isSuperAdmin = currentUser?.role === BureauRole.SUPER_ADMIN;
  const canAddMember =
    isSuperAdmin ||
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.VICE_PRESIDENT ||
    currentUser?.role === BureauRole.SECRETAIRE_GENERAL ||
    currentUser?.role === BureauRole.SECRETAIRE_ADJOINT;

  const updateFy = useUpdateFiscalYear(params.id);
  const deleteFy = useDeleteFiscalYear();
  const closeFy = useCloseFiscalYear();

  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmCassation, setConfirmCassation] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    label: fy?.label ?? '',
    startDate: fy?.startDate?.substring(0, 10) ?? '',
    endDate: fy?.endDate?.substring(0, 10) ?? '',
    cassationDate: fy?.cassationDate?.substring(0, 10) ?? '',
    loanDueDate: fy?.loanDueDate?.substring(0, 10) ?? '',
    notes: fy?.notes ?? '',
  });
  const [showAddMember, setShowAddMember] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    profileId: '',
    enrollmentType: 'NEW' as 'NEW' | 'RETURNING',
    sharesCount: 1,
    joinedAt: fy?.startDate?.substring(0, 10) ?? '',
    joinedAtMonth: 1,
  });

  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
  const [editMembershipForm, setEditMembershipForm] = useState({ joinedAt: '', joinedAtMonth: 1, sharesCount: 1 });

  const enrolledIds = new Set(memberships?.map((m) => m.profileId) ?? []);
  const availableMembers = allMembers?.data.filter((m) => !enrolledIds.has(m.id)) ?? [];

  const handleActivate = async () => {
    await activate.mutateAsync(params.id);
  };

  const handleOpenCassation = async () => {
    await openCassation.mutateAsync(params.id);
  };

  const handleEditOpen = () => {
    setEditForm({
      label: fy!.label,
      startDate: fy!.startDate.substring(0, 10),
      endDate: fy!.endDate.substring(0, 10),
      cassationDate: fy!.cassationDate.substring(0, 10),
      loanDueDate: fy!.loanDueDate.substring(0, 10),
      notes: fy!.notes ?? '',
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFy.mutateAsync(editForm);
    setShowEdit(false);
  };

  const handleClose = async () => {
    await closeFy.mutateAsync(params.id);
    setConfirmClose(false);
  };

  const handleDelete = async () => {
    await deleteFy.mutateAsync(params.id);
    router.push('/fiscal-year');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!form.profileId) { setAddError('Sélectionnez un membre.'); return; }
    try {
      await addMember.mutateAsync({
        ...form,
        joinedAt: form.joinedAt || fy!.startDate.substring(0, 10),
      });
      setShowAddMember(false);
      setForm({ profileId: '', enrollmentType: 'NEW', sharesCount: 1, joinedAt: fy?.startDate?.substring(0, 10) ?? '', joinedAtMonth: 1 });
    } catch {
      setAddError('Erreur lors de l\'inscription du membre.');
    }
  };

  const handleEditMembership = (m: { id: string; joinedAt: string; joinedAtMonth: number; shareCommitment?: { sharesCount: string | number } | null }) => {
    setEditingMembershipId(m.id);
    setEditMembershipForm({
      joinedAt: new Date(m.joinedAt).toISOString().substring(0, 10),
      joinedAtMonth: m.joinedAtMonth,
      sharesCount: Number(m.shareCommitment?.sharesCount ?? 1),
    });
  };

  const handleUpdateMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembershipId) return;
    await updateMembership.mutateAsync({ membershipId: editingMembershipId, payload: editMembershipForm });
    setEditingMembershipId(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Chargement…</div>;
  }

  if (isError || !fy) {
    return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Exercice introuvable.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={fy.label}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Exercices fiscaux', href: '/fiscal-year' },
          { label: fy.label },
        ]}
        action={
          isSuperAdmin && (
            <div className="flex gap-2 flex-wrap">
              {fy.status === 'PENDING' && (
                <>
                  <Button size="sm" variant="secondary" onClick={handleEditOpen}>
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmDelete(true)}
                    isLoading={deleteFy.isPending}
                  >
                    Supprimer
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmActivate(true)}
                    isLoading={activate.isPending}
                  >
                    Activer l&apos;exercice
                  </Button>
                </>
              )}
              {fy.status === 'ACTIVE' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirmCassation(true)}
                    isLoading={openCassation.isPending}
                  >
                    Ouvrir la cassation
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmClose(true)}
                    isLoading={closeFy.isPending}
                  >
                    Clôturer
                  </Button>
                </>
              )}
              {fy.status === 'CASSATION' && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setConfirmClose(true)}
                  isLoading={closeFy.isPending}
                >
                  Clôturer l&apos;exercice
                </Button>
              )}
            </div>
          )
        }
      />

      {/* ── Informations générales ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Informations générales</h2>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[fy.status]}`}>
            {STATUS_LABELS[fy.status]}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Début" value={new Date(fy.startDate).toLocaleDateString('fr-FR')} />
          <InfoRow label="Fin" value={new Date(fy.endDate).toLocaleDateString('fr-FR')} />
          <InfoRow label="Date limite prêts" value={new Date(fy.loanDueDate).toLocaleDateString('fr-FR')} />
          <InfoRow label="Date de cassation" value={new Date(fy.cassationDate).toLocaleDateString('fr-FR')} />
          {fy.notes && <InfoRow label="Notes" value={fy.notes} />}
        </div>
      </div>

      {/* ── Formulaire de modification ── */}
      {showEdit && (
        <div className="bg-white rounded-xl border border-indigo-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Modifier l&apos;exercice fiscal</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Libellé</label>
              <input
                type="text"
                required
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Date de début</label>
                <input type="date" required value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Date limite prêts</label>
                <input type="date" required value={editForm.loanDueDate} onChange={(e) => setEditForm({ ...editForm, loanDueDate: e.target.value })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Date de cassation</label>
                <input type="date" required value={editForm.cassationDate} onChange={(e) => setEditForm({ ...editForm, cassationDate: e.target.value })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Date de fin</label>
                <input type="date" required value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Notes (optionnel)</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={updateFy.isPending}>
                Enregistrer
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowEdit(false)}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Modales de confirmation */}
      <ConfirmDialog
        isOpen={confirmActivate}
        title="Activer cet exercice"
        message="Cette action est irréversible. L'exercice passera en statut ACTIF et les membres pourront être inscrits."
        confirmLabel="Activer"
        variant="warning"
        isLoading={activate.isPending}
        onConfirm={async () => { await handleActivate(); setConfirmActivate(false); }}
        onCancel={() => setConfirmActivate(false)}
      />
      <ConfirmDialog
        isOpen={confirmClose}
        title="Clôturer cet exercice"
        message={`Voulez-vous vraiment clôturer l'exercice "${fy.label}" ? L'exercice passera en statut CLÔTURÉ et sera accessible uniquement en lecture seule.`}
        confirmLabel="Clôturer"
        variant="danger"
        isLoading={closeFy.isPending}
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
      />
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Supprimer cet exercice"
        message={`Voulez-vous vraiment supprimer l'exercice "${fy.label}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteFy.isPending}
        onConfirm={async () => { await handleDelete(); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        isOpen={confirmCassation}
        title="Ouvrir la cassation"
        message="L'exercice passera en mode CASSATION. Les remboursements de prêts resteront possibles mais aucune nouvelle transaction ne pourra être ajoutée."
        confirmLabel="Ouvrir la cassation"
        variant="warning"
        isLoading={openCassation.isPending}
        onConfirm={async () => { await handleOpenCassation(); setConfirmCassation(false); }}
        onCancel={() => setConfirmCassation(false)}
      />

      {/* ── Visualisation inscriptions ── */}
      {memberships && memberships.length > 0 && (() => {
        const newCount       = memberships.filter((m) => m.enrollmentType === 'NEW').length;
        const returningCount = memberships.filter((m) => m.enrollmentType === 'RETURNING').length;
        const typeData = [
          { name: 'Nouveaux',        value: newCount,       color: '#10b981' },
          { name: 'Ré-inscriptions', value: returningCount, color: '#3b82f6' },
        ].filter((d) => d.value > 0);

        const sharesOf = (m: typeof memberships[0]) => Number(m.shareCommitment?.sharesCount ?? 0);
        const totalShares = memberships.reduce((s, m) => s + sharesOf(m), 0);
        const sharesData = memberships
          .filter((m) => sharesOf(m) > 0)
          .sort((a, b) => sharesOf(b) - sharesOf(a))
          .slice(0, 8)
          .map((m) => ({
            name: m.profile ? `${m.profile.lastName.charAt(0)}. ${m.profile.firstName}` : m.profileId.slice(-4),
            Parts: sharesOf(m),
          }));

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Type d'inscription" subtitle={`${memberships.length} membres — ${totalShares} parts total`}>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="42%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                      {typeData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, n: string) => [`${v} membre${v > 1 ? 's' : ''}`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={7} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {sharesData.length > 0 && (
              <ChartCard title="Parts par membre" subtitle="Top 8 — engagements de parts">
                <div className="h-52 px-2 pb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sharesData} layout="vertical" barSize={12} margin={{ top: 4, right: 12, bottom: 0, left: 72 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip formatter={(v: number) => [`${v} part${v > 1 ? 's' : ''}`]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="Parts" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}
          </div>
        );
      })()}

      {/* ── Membres inscrits ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-800">
            Membres inscrits{' '}
            <span className="text-gray-500 font-normal text-sm">
              ({memberships?.length ?? 0})
            </span>
          </h2>
          {canAddMember && fy.status !== 'CLOSED' && (
            <Button
              size="sm"
              variant={showAddMember ? 'secondary' : 'primary'}
              onClick={() => setShowAddMember(!showAddMember)}
            >
              {showAddMember ? '− Fermer' : '+ Inscrire un membre'}
            </Button>
          )}
        </div>

        {/* Formulaire inscription */}
        {showAddMember && (
          <form onSubmit={handleAddMember} className="px-6 py-4 bg-blue-50 border-b border-blue-100 space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <Select
                  label="Membre"
                  value={form.profileId}
                  onChange={(e) => setForm({ ...form, profileId: e.target.value })}
                  aria-label="Sélectionner un membre"
                  disabled={isMembersLoading}
                  className="py-1.5 text-xs"
                >
                  {isMembersLoading ? (
                    <option value="">Chargement des membres…</option>
                  ) : availableMembers.length === 0 ? (
                    <option value="">Tous les membres sont déjà inscrits</option>
                  ) : (
                    <>
                      <option value="">Sélectionner…</option>
                      {availableMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.lastName} {m.firstName} — {m.memberCode}
                        </option>
                      ))}
                    </>
                  )}
                </Select>
              </div>

              <div>
                <Select
                  label="Type"
                  value={form.enrollmentType}
                  onChange={(e) => setForm({ ...form, enrollmentType: e.target.value as 'NEW' | 'RETURNING' })}
                  aria-label="Type d'inscription"
                  className="py-1.5 text-xs"
                >
                  <option value="NEW">Nouveau</option>
                  <option value="RETURNING">Ré-inscription</option>
                </Select>
              </div>

              <div>
                <label htmlFor="shares-count" className="text-xs font-medium text-gray-700 block mb-1">Parts</label>
                <input
                  id="shares-count"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="10"
                  value={form.sharesCount}
                  onChange={(e) => setForm({ ...form, sharesCount: parseFloat(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                />
              </div>

              <div>
                <label htmlFor="joined-at" className="text-xs font-medium text-gray-700 block mb-1">Date inscription</label>
                <input
                  id="joined-at"
                  type="date"
                  value={form.joinedAt}
                  min={fy?.startDate?.substring(0, 10)}
                  max={fy?.cassationDate?.substring(0, 10) ?? fy?.endDate?.substring(0, 10)}
                  onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                />
              </div>

              <div>
                <label htmlFor="joined-at-month" className="text-xs font-medium text-gray-700 block mb-1">Mois (1-12)</label>
                <input
                  id="joined-at-month"
                  type="number"
                  min="1"
                  max="12"
                  value={form.joinedAtMonth}
                  onChange={(e) => setForm({ ...form, joinedAtMonth: parseInt(e.target.value) })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                />
              </div>
            </div>

            {addError && <p className="text-xs text-red-600">{addError}</p>}

            <div className="flex gap-2">
              <Button type="submit" size="sm" isLoading={addMember.isPending}>
                Inscrire
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowAddMember(false)}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {/* Table membres */}
        {!memberships || memberships.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Aucun membre inscrit à cet exercice.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600 w-10">#</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Parts</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Inscrit le</th>
                {canAddMember && fy.status === 'ACTIVE' && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memberships.map((m, index) => {
                const isEditing = editingMembershipId === m.id;
                const isLocked = (m.shareCommitment as any)?.isLocked === true;
                return isEditing ? (
                  <tr key={m.id} className="bg-blue-50">
                    <td className="px-6 py-3 text-gray-400 text-xs">{index + 1}</td>
                    <td colSpan={2} className="px-6 py-3 font-medium text-gray-900 text-sm">
                      {m.profile ? `${m.profile.lastName} ${m.profile.firstName}` : m.profileId}
                    </td>
                    <td colSpan={4} className="px-6 py-2">
                      <form onSubmit={handleUpdateMembership} className="flex items-end gap-2 flex-wrap">
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-0.5">Date</label>
                          <input
                            type="date"
                            value={editMembershipForm.joinedAt}
                            min={fy?.startDate?.substring(0, 10)}
                            max={fy?.cassationDate?.substring(0, 10) ?? fy?.endDate?.substring(0, 10)}
                            onChange={(e) => setEditMembershipForm({ ...editMembershipForm, joinedAt: e.target.value })}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-0.5">Mois</label>
                          <input
                            type="number" min="1" max="12"
                            value={editMembershipForm.joinedAtMonth}
                            onChange={(e) => setEditMembershipForm({ ...editMembershipForm, joinedAtMonth: parseInt(e.target.value) })}
                            className="text-xs border border-gray-300 rounded px-2 py-1 w-14"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-500 block mb-0.5">Parts</label>
                          <input
                            type="number" step="0.25" min="0.25" max="10"
                            value={editMembershipForm.sharesCount}
                            onChange={(e) => setEditMembershipForm({ ...editMembershipForm, sharesCount: parseFloat(e.target.value) })}
                            className="text-xs border border-gray-300 rounded px-2 py-1 w-16"
                          />
                        </div>
                        <button type="submit" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700">
                          Sauvegarder
                        </button>
                        <button type="button" onClick={() => setEditingMembershipId(null)} className="text-xs text-gray-500 px-3 py-1.5 rounded hover:bg-gray-100">
                          Annuler
                        </button>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 text-gray-400 text-xs tabular-nums">{index + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {m.profile
                        ? `${m.profile.lastName} ${m.profile.firstName}`
                        : m.profileId}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-600 text-xs">
                      {m.profile?.memberCode ?? '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.enrollmentType === 'NEW'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.enrollmentType === 'NEW' ? 'Nouveau' : 'Ré-inscription'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {m.shareCommitment?.sharesCount ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(m.joinedAt).toLocaleDateString('fr-FR')}
                    </td>
                    {canAddMember && fy.status === 'ACTIVE' && (
                      <td className="px-6 py-3 text-right">
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => handleEditMembership(m as any)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Modifier
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
