'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import {
  useMember,
  useDeactivateMember,
  useReactivateMember,
  useChangeRole,
} from '@lib/hooks/useMembers';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';

interface MemberDetailPageProps {
  params: { id: string };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  const router = useRouter();
  const { data: member, isLoading, isError } = useMember(params.id);
  const { data: currentUser } = useCurrentUser();
  const deactivate = useDeactivateMember();
  const reactivate = useReactivateMember();
  const changeRole = useChangeRole(params.id);

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === BureauRole.SUPER_ADMIN;

  const handleToggleActive = async () => {
    if (!member) return;
    if (member.user.isActive) {
      setConfirmDeactivate(true);
    } else {
      await reactivate.mutateAsync(member.id);
      router.refresh();
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!member) return;
    await deactivate.mutateAsync(member.id);
    setConfirmDeactivate(false);
    router.refresh();
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    if (!newRole || !member) return;
    setPendingRole(newRole);
  };

  const handleConfirmRole = async () => {
    if (!pendingRole) return;
    await changeRole.mutateAsync(pendingRole);
    setPendingRole(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Chargement…
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">
        Membre introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${member.lastName} ${member.firstName}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: member.memberCode },
        ]}
        action={
          <div className="flex gap-2">
            <Link
              href={`/members/${member.id}/edit`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Modifier
            </Link>
            {isSuperAdmin && (
              <Button
                variant={member.user.isActive ? 'danger' : 'secondary'}
                size="sm"
                onClick={handleToggleActive}
                isLoading={deactivate.isPending || reactivate.isPending}
              >
                {member.user.isActive ? 'Désactiver' : 'Réactiver'}
              </Button>
            )}
          </div>
        }
      />

      {/* ── Informations personnelles ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow label="Code membre" value={<span className="font-mono">{member.memberCode}</span>} />
          <InfoRow
            label="Statut"
            value={
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                  member.user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {member.user.isActive ? 'Actif' : 'Inactif'}
              </span>
            }
          />
          <InfoRow label="Prénom" value={member.firstName} />
          <InfoRow label="Nom" value={member.lastName} />
          <InfoRow label="Téléphone principal" value={member.phone1} />
          <InfoRow label="Téléphone secondaire" value={member.phone2} />
          <InfoRow label="Quartier" value={member.neighborhood} />
          <InfoRow label="Détail localisation" value={member.locationDetail} />
          <InfoRow
            label="Mobile Money"
            value={
              member.mobileMoneyType
                ? `${member.mobileMoneyType} — ${member.mobileMoneyNumber}`
                : null
            }
          />
        </div>
      </div>

      {/* ── Compte utilisateur ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Compte utilisateur</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Identifiant" value={member.user.username} />
          <div className="flex flex-col sm:flex-row sm:gap-4 sm:items-center">
            <span className="text-sm text-gray-500 sm:w-40 shrink-0">Rôle</span>
            {isSuperAdmin ? (
              <select
                value={member.user.role}
                onChange={handleRoleChange}
                disabled={changeRole.isPending}
                aria-label="Rôle bureau"
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.values(BureauRole).map((r) => (
                  <option key={r} value={r}>
                    {BUREAU_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-gray-900 font-medium">
                {BUREAU_ROLE_LABELS[member.user.role as BureauRole] ?? member.user.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Contacts d'urgence ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Contacts d&apos;urgence</h2>
        {!member.emergencyContacts || member.emergencyContacts.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun contact d&apos;urgence enregistré.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {member.emergencyContacts.map((contact) => (
              <div key={contact.id} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <InfoRow label="Nom" value={contact.fullName} />
                <InfoRow label="Téléphone" value={contact.phone} />
                <InfoRow label="Relation" value={contact.relation} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales de confirmation */}
      <ConfirmDialog
        isOpen={confirmDeactivate}
        title="Désactiver ce membre"
        message={`Le compte de ${member.firstName} ${member.lastName} sera désactivé. Le membre ne pourra plus se connecter.`}
        confirmLabel="Désactiver"
        variant="danger"
        isLoading={deactivate.isPending}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
      />

      <ConfirmDialog
        isOpen={!!pendingRole}
        title="Modifier le rôle"
        message={`Attribuer le rôle "${pendingRole ? (BUREAU_ROLE_LABELS[pendingRole as BureauRole] ?? pendingRole) : ''}" à ${member.firstName} ${member.lastName} ?`}
        confirmLabel="Confirmer"
        variant="warning"
        isLoading={changeRole.isPending}
        onConfirm={handleConfirmRole}
        onCancel={() => setPendingRole(null)}
      />
    </div>
  );
}
