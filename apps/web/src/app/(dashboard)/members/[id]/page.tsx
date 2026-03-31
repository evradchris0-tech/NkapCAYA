'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Banknote, Gift, History, Download } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import { Skeleton } from '@components/ui/Skeleton';
import {
  useMember, useDeactivateMember, useReactivateMember, useChangeRole,
  useMemberMemberships,
} from '@lib/hooks/useMembers';
import { useFiscalYears } from '@lib/hooks/useFiscalYear';
import { useSavingsByMembership } from '@lib/hooks/useSavings';
import { useLoansByMembership } from '@lib/hooks/useLoans';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';
import type { LoanStatus } from '@/types/domain.types';
import { exportMemberToPdf } from '@lib/export/exportPdf';

interface MemberDetailPageProps { params: { id: string } }

const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'En cours',
  PARTIALLY_REPAID: 'Partiel',
  CLOSED: 'Clôturé',
};
const LOAN_STATUS_COLORS: Record<LoanStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  PARTIALLY_REPAID: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-500',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, iconColor, iconBg, title, children }: {
  icon: React.ElementType; iconColor: string; iconBg: string;
  title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
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

  // Memberships du membre (tous exercices)
  const { data: memberships, isLoading: loadingMemberships } = useMemberMemberships(params.id);
  const { data: fiscalYears } = useFiscalYears();
  const activeFy = fiscalYears?.find((f) => f.status === 'ACTIVE');

  // Trouver le membership de l'exercice actif
  const activeMembership = Array.isArray(memberships)
    ? memberships.find((m: any) => m.fiscalYearId === activeFy?.id)
    : undefined;

  // Épargne + prêts du membership actif
  const { data: savings, isLoading: loadingSavings } = useSavingsByMembership(activeMembership?.id ?? '');
  const { data: loans, isLoading: loadingLoans } = useLoansByMembership(activeMembership?.id ?? '');

  // Slot bénéficiaire
  const { data: schedule } = useBeneficiarySchedule(activeFy?.id ?? '');
  const mySlots = schedule?.slots?.filter((s) => s.membershipId === activeMembership?.id) ?? [];
  const nextSlot = mySlots.find((s) => s.status === 'ASSIGNED') ?? mySlots.find((s) => s.status === 'UNASSIGNED');

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const isSuperAdmin = currentUser?.role === BureauRole.SUPER_ADMIN;
  const isPresident = currentUser?.role === BureauRole.PRESIDENT;
  const canManageActivity = isSuperAdmin || isPresident;

  const handleToggleActive = async () => {
    if (!member) return;
    if (member.user.isActive) setConfirmDeactivate(true);
    else { await reactivate.mutateAsync(member.id); router.refresh(); }
  };

  const handleConfirmDeactivate = async () => {
    if (!member) return;
    await deactivate.mutateAsync(member.id);
    setConfirmDeactivate(false);
    router.refresh();
  };

  const handleExportPdf = () => {
    if (!member) return;
    const activeLoan = loans?.find((l: any) => l.status === 'ACTIVE' || l.status === 'PARTIALLY_REPAID');
    const enrollments = Array.isArray(memberships)
      ? (memberships as any[]).map((m) => {
          const fy = fiscalYears?.find((f) => f.id === m.fiscalYearId);
          return {
            fyLabel: fy?.label ?? m.fiscalYearId.slice(-6),
            type: m.enrollmentType === 'NEW' ? 'Nouveau' : 'Ré-inscription',
            shares: String(Number(m.shareCommitment?.sharesCount ?? 0)),
            joinedAt: new Date(m.joinedAt).toLocaleDateString('fr-FR'),
          };
        })
      : [];
    exportMemberToPdf(
      {
        firstName: member.firstName,
        lastName: member.lastName,
        memberCode: member.memberCode,
        phone: member.phone1 ?? undefined,
        neighborhood: member.neighborhood ?? undefined,
        role: BUREAU_ROLE_LABELS[member.user.role as BureauRole] ?? member.user.role,
        isActive: member.user.isActive,
        savingsBalance: savings?.balance ?? '0',
        savingsPrincipal: savings?.principalBalance ?? '0',
        savingsInterests: savings?.totalInterestReceived ?? '0',
        activeLoanAmount: activeLoan ? String(activeLoan.principalAmount) : undefined,
        activeLoanOutstanding: activeLoan
          ? String(parseFloat(activeLoan.principalAmount) - parseFloat(activeLoan.totalRepaid))
          : undefined,
        activeLoanStatus: activeLoan ? activeLoan.status : undefined,
        enrollments,
      },
      activeFy?.label ?? '',
    );
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

  if (isLoading) return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Chargement…</div>;
  if (isError || !member) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Membre introuvable.</div>;

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
            <Button variant="secondary" size="sm" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Link
              href={`/members/${member.id}/edit`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Modifier
            </Link>
            {canManageActivity && (
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
          <InfoRow label="Statut" value={
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${member.user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {member.user.isActive ? 'Actif' : 'Inactif'}
            </span>
          } />
          <InfoRow label="Prénom" value={member.firstName} />
          <InfoRow label="Nom" value={member.lastName} />
          <InfoRow label="Téléphone principal" value={member.phone1} />
          <InfoRow label="Téléphone secondaire" value={member.phone2} />
          <InfoRow label="Quartier" value={member.neighborhood} />
          <InfoRow label="Détail localisation" value={member.locationDetail} />
          <InfoRow label="Mobile Money" value={member.mobileMoneyType ? `${member.mobileMoneyType} — ${member.mobileMoneyNumber}` : null} />
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
              <Select
                value={member.user.role}
                onChange={handleRoleChange}
                disabled={changeRole.isPending}
                aria-label="Rôle bureau"
              >
                {Object.values(BureauRole).map((r) => (
                  <option key={r} value={r}>{BUREAU_ROLE_LABELS[r]}</option>
                ))}
              </Select>
            ) : (
              <span className="text-sm text-gray-900 font-medium">
                {BUREAU_ROLE_LABELS[member.user.role as BureauRole] ?? member.user.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Épargne exercice actif ── */}
      {activeFy && (
        <SectionCard icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-50" title={`Épargne — ${activeFy.label}`}>
          {!activeMembership ? (
            <p className="text-sm text-gray-400">Non inscrit à l'exercice actif.</p>
          ) : loadingSavings ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : savings ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Solde total',    value: parseFloat(savings.balance),              color: 'text-gray-900' },
                { label: 'Capital versé',  value: parseFloat(savings.principalBalance),     color: 'text-gray-700' },
                { label: 'Intérêts reçus', value: parseFloat(savings.totalInterestReceived), color: 'text-blue-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className={`font-semibold tabular-nums text-sm ${color}`}>
                    {value.toLocaleString('fr-FR')} XAF
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun compte d'épargne pour cet exercice.</p>
          )}
          {savings && (
            <Link href="/savings" className="text-xs text-blue-600 hover:underline">
              Voir le détail de l'épargne →
            </Link>
          )}
        </SectionCard>
      )}

      {/* ── Prêts actifs ── */}
      {activeFy && activeMembership && (
        <SectionCard icon={Banknote} iconColor="text-emerald-600" iconBg="bg-emerald-50" title="Prêts">
          {loadingLoans ? (
            <Skeleton className="h-16 rounded-lg" />
          ) : !loans || loans.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun prêt pour cet exercice.</p>
          ) : (
            <div className="space-y-2">
              {loans.map((loan: any) => {
                const pct = parseFloat(loan.principalAmount) > 0
                  ? Math.min((parseFloat(loan.totalRepaid) / parseFloat(loan.principalAmount)) * 100, 100)
                  : 0;
                return (
                  <div key={loan.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">
                        {parseFloat(loan.principalAmount).toLocaleString('fr-FR')} XAF
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LOAN_STATUS_COLORS[loan.status as LoanStatus]}`}>
                        {LOAN_STATUS_LABELS[loan.status as LoanStatus]}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Remboursé : {parseFloat(loan.totalRepaid).toLocaleString('fr-FR')} XAF ({pct.toFixed(0)} %)</span>
                      <Link href={`/loans/${loan.id}`} className="text-blue-600 hover:underline">Détail →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Slot bénéficiaire ── */}
      {activeFy && activeMembership && (
        <SectionCard icon={Gift} iconColor="text-violet-600" iconBg="bg-violet-50" title="Slot bénéficiaire programmé">
          {!nextSlot ? (
            <p className="text-sm text-gray-400">Aucun slot attribué pour cet exercice.</p>
          ) : (
            <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
              <div className="text-center shrink-0">
                <p className="text-2xl font-bold text-gray-900 tabular-nums">M{nextSlot.month}</p>
                <p className="text-xs text-gray-400">Mois</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {parseFloat(nextSlot.amountDelivered).toLocaleString('fr-FR')} XAF
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Slot #{nextSlot.slotIndex}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                nextSlot.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                nextSlot.status === 'ASSIGNED'  ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {nextSlot.status === 'DELIVERED' ? 'Livré' : nextSlot.status === 'ASSIGNED' ? 'Désigné' : 'Non désigné'}
              </span>
            </div>
          )}
          {mySlots.length > 1 && (
            <p className="text-xs text-gray-400">{mySlots.length} slot{mySlots.length > 1 ? 's' : ''} au total cet exercice.</p>
          )}
        </SectionCard>
      )}

      {/* ── Historique des exercices ── */}
      <SectionCard icon={History} iconColor="text-amber-600" iconBg="bg-amber-50" title="Historique des inscriptions">
        {loadingMemberships ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : !Array.isArray(memberships) || memberships.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun historique d'inscription.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 pr-4">Exercice</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Parts</th>
                  <th className="pb-2">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(memberships as any[]).map((m) => {
                  const fy = fiscalYears?.find((f) => f.id === m.fiscalYearId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-800">
                        {fy ? (
                          <Link href={`/fiscal-year/${fy.id}`} className="hover:text-blue-600 hover:underline">
                            {fy.label}
                          </Link>
                        ) : m.fiscalYearId.slice(-6)}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${m.enrollmentType === 'NEW' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {m.enrollmentType === 'NEW' ? 'Nouveau' : 'Ré-inscription'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{Number(m.shareCommitment?.sharesCount ?? 0)}</td>
                      <td className="py-2 text-gray-500">
                        {new Date(m.joinedAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

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

      {/* Modales */}
      <ConfirmDialog
        isOpen={confirmDeactivate}
        title="Désactiver ce membre"
        message={`Le compte de ${member.firstName} ${member.lastName} sera désactivé.`}
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
