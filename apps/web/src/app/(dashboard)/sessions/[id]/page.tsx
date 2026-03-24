'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import TransactionForm from '@components/forms/TransactionForm';
import { useSession, useOpenSession, useCloseForReview, useValidateAndClose } from '@lib/hooks/useSessions';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole, TRANSACTION_TYPE_LABELS, TransactionType } from '@/types/domain.types';

interface Props {
  params: { id: string };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  REVIEWING: 'En révision',
  CLOSED: 'Clôturée',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  OPEN: 'bg-green-100 text-green-700',
  REVIEWING: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-blue-100 text-blue-700',
};

function AmountCell({ label, value }: { label: string; value: string }) {
  const n = parseFloat(value || '0');
  if (n === 0) return null;
  return (
    <div className="flex justify-between text-sm py-1 border-b border-gray-50">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium tabular-nums">{n.toLocaleString('fr-FR')} XAF</span>
    </div>
  );
}

export default function SessionDetailPage({ params }: Props) {
  const { data: session, isLoading, isError } = useSession(params.id);
  const { data: currentUser } = useCurrentUser();
  const openSession = useOpenSession();
  const closeForReview = useCloseForReview();
  const validateAndClose = useValidateAndClose();
  const [showForm, setShowForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReview, setConfirmReview] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);

  const { data: memberships } = useFiscalYearMemberships(session?.fiscalYearId ?? '');

  const isTresorier =
    currentUser?.role === BureauRole.TRESORIER ||
    currentUser?.role === BureauRole.SUPER_ADMIN;
  const isPresident =
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

  const handleOpen = async () => {
    await openSession.mutateAsync(params.id);
  };

  const handleCloseForReview = async () => {
    await closeForReview.mutateAsync(params.id);
  };

  const handleValidate = async () => {
    await validateAndClose.mutateAsync(params.id);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Chargement…</div>;
  }
  if (isError || !session) {
    return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Session introuvable.</div>;
  }

  const totalGeneral = [
    session.totalCotisation, session.totalPot, session.totalInscription,
    session.totalSecours, session.totalRbtPrincipal, session.totalRbtInterest,
    session.totalEpargne, session.totalProjet, session.totalAutres,
  ].reduce((sum, v) => sum + parseFloat(v || '0'), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Session #${session.sessionNumber}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Sessions', href: '/sessions' },
          { label: `Session #${session.sessionNumber}` },
        ]}
        action={
          <div className="flex gap-2">
            {session.status === 'DRAFT' && isTresorier && (
              <Button size="sm" onClick={() => setConfirmOpen(true)} isLoading={openSession.isPending}>
                Ouvrir la session
              </Button>
            )}
            {session.status === 'OPEN' && isTresorier && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
                  {showForm ? 'Masquer formulaire' : '+ Transaction'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmReview(true)} isLoading={closeForReview.isPending}>
                  Soumettre pour révision
                </Button>
              </>
            )}
            {session.status === 'REVIEWING' && isPresident && (
              <Button size="sm" onClick={() => setConfirmValidate(true)} isLoading={validateAndClose.isPending}>
                Valider et clôturer
              </Button>
            )}
          </div>
        }
      />

      {/* ── Infos générales ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Date de réunion</p>
          <p className="font-semibold text-gray-900">
            {new Date(session.meetingDate).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Statut</p>
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[session.status] ?? ''}`}>
            {STATUS_LABELS[session.status] ?? session.status}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total collecté</p>
          <p className="font-semibold text-gray-900 tabular-nums">
            {totalGeneral.toLocaleString('fr-FR')} XAF
          </p>
        </div>
      </div>

      {/* ── Formulaire transaction ── */}
      {showForm && session.status === 'OPEN' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-xl">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Nouvelle transaction</h2>
          <TransactionForm
            sessionId={params.id}
            memberships={memberships ?? []}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      {/* ── Totaux par type ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Totaux par type</h2>
        <div className="space-y-0.5">
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.COTISATION]} value={session.totalCotisation} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.POT]} value={session.totalPot} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.INSCRIPTION]} value={session.totalInscription} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.SECOURS]} value={session.totalSecours} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.RBT_PRINCIPAL]} value={session.totalRbtPrincipal} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.RBT_INTEREST]} value={session.totalRbtInterest} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.EPARGNE]} value={session.totalEpargne} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.PROJET]} value={session.totalProjet} />
          <AmountCell label={TRANSACTION_TYPE_LABELS[TransactionType.AUTRES]} value={session.totalAutres} />
        </div>
        {totalGeneral === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune transaction enregistrée.</p>
        )}
      </div>

      {/* Modales de confirmation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Ouvrir la session"
        message="Les transactions pourront être saisies une fois la session ouverte."
        confirmLabel="Ouvrir"
        variant="info"
        isLoading={openSession.isPending}
        onConfirm={async () => { await handleOpen(); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        isOpen={confirmReview}
        title="Soumettre pour révision"
        message="Plus aucune transaction ne pourra être ajoutée. La session sera soumise au Président pour validation."
        confirmLabel="Soumettre"
        variant="warning"
        isLoading={closeForReview.isPending}
        onConfirm={async () => { await handleCloseForReview(); setConfirmReview(false); }}
        onCancel={() => setConfirmReview(false)}
      />
      <ConfirmDialog
        isOpen={confirmValidate}
        title="Valider et clôturer la session"
        message="Les intérêts seront distribués automatiquement. Cette action est irréversible."
        confirmLabel="Valider et clôturer"
        variant="warning"
        isLoading={validateAndClose.isPending}
        onConfirm={async () => { await handleValidate(); setConfirmValidate(false); }}
        onCancel={() => setConfirmValidate(false)}
      />

      {/* ── Entrées individuelles ── */}
      {session.entries && session.entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">
              Transactions ({session.entries.length})
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Référence</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {session.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">{entry.reference}</td>
                  <td className="px-6 py-3 text-gray-700">
                    {entry.membership
                      ? `${entry.membership.lastName} ${entry.membership.firstName}`
                      : entry.membershipId}
                  </td>
                  <td className="px-6 py-3">
                    {TRANSACTION_TYPE_LABELS[entry.type as TransactionType] ?? entry.type}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-medium">
                    {parseFloat(entry.amount).toLocaleString('fr-FR')} XAF
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
