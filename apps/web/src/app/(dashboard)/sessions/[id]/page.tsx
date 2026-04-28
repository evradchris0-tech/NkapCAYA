'use client';

import { useMemo, useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Select from '@components/ui/Select';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import ChartCard from '@components/ui/ChartCard';
import TransactionModal from '@components/forms/TransactionModal';
import BatchTransactionModal from '@components/forms/BatchTransactionModal';
import Modal from '@components/ui/Modal';
import { Skeleton } from '@components/ui/Skeleton';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, CreditCard, TrendingUp, Banknote,
  CheckCircle2, Clock, Circle, Gift, AlertTriangle,
  Pencil, Trash2, Download,
} from 'lucide-react';
import { useSession, useOpenSession, useCloseForReview, useValidateAndClose, useUpdateEntry, useDeleteEntry } from '@lib/hooks/useSessions';
import { exportSessionDetailToPdf } from '@lib/export/exportPdf';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import {
  useBeneficiarySchedule,
  useMarkDelivered,
  useAssignSlot,
  useSetHost,
  useAddSlotToSession,
} from '@lib/hooks/useBeneficiaries';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole, TRANSACTION_TYPE_LABELS, TransactionType } from '@/types/domain.types';
import type { BeneficiarySlot, SessionEntry } from '@/types/api.types';

interface Props {
  params: { id: string };
}

const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#f43f5e','#14b8a6','#f97316','#6366f1','#94a3b8'];

function AmountCell({ label, value }: { label: string; value: string }) {
  const n = parseFloat(value || '0');
  if (n === 0) return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-50">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium tabular-nums">{n.toLocaleString('fr-FR')} XAF</span>
    </div>
  );
}

function KpiCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: React.ReactNode; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color} shrink-0`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
        <div className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</div>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Timeline étape
const WORKFLOW: { key: string; label: string }[] = [
  { key: 'DRAFT',     label: 'Brouillon créé' },
  { key: 'OPEN',      label: 'Session ouverte' },
  { key: 'REVIEWING', label: 'En révision' },
  { key: 'CLOSED',    label: 'Validée & clôturée' },
];
const STATUS_ORDER: Record<string, number> = { DRAFT: 0, OPEN: 1, REVIEWING: 2, CLOSED: 3 };

export default function SessionDetailPage({ params }: Props) {
  const { data: session, isLoading, isError } = useSession(params.id);
  const { data: currentUser } = useCurrentUser();
  const openSession = useOpenSession();
  const closeForReview = useCloseForReview();
  const validateAndClose = useValidateAndClose();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReview, setConfirmReview] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);
  const [deliverySlotId, setDeliverySlotId] = useState<string | null>(null);
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [assignMembershipId, setAssignMembershipId] = useState<Record<string, string>>({});

  // CRUD transaction
  const [editEntry, setEditEntry] = useState<SessionEntry | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const updateEntry = useUpdateEntry(params.id);
  const deleteEntryMutation = useDeleteEntry(params.id);

  const { data: memberships } = useFiscalYearMemberships(session?.fiscalYearId ?? '');
  const { data: schedule } = useBeneficiarySchedule(session?.fiscalYearId ?? '');
  const markDelivered = useMarkDelivered(session?.fiscalYearId ?? '');
  const assignSlot = useAssignSlot(session?.fiscalYearId ?? '');
  const setHost = useSetHost(session?.fiscalYearId ?? '');
  const addSlot = useAddSlotToSession(session?.fiscalYearId ?? '');

  const isTresorier =
    currentUser?.role === BureauRole.TRESORIER ||
    currentUser?.role === BureauRole.SUPER_ADMIN;
  const isPresident =
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.SUPER_ADMIN;
  const canOpenSession =
    isPresident ||
    currentUser?.role === BureauRole.VICE_PRESIDENT ||
    isTresorier;

  /* ── Calculs dérivés ── */
  const derived = useMemo(() => {
    if (!session) return null;

    const entries = session.entries ?? [];

    // Total général
    const totalGeneral = [
      session.totalCotisation, session.totalPot, session.totalInscription,
      session.totalSecours, session.totalRbtPrincipal, session.totalRbtInterest,
      session.totalEpargne, session.totalProjet, session.totalAutres,
    ].reduce((sum, v) => sum + parseFloat(v || '0'), 0);

    // Participants ayant au moins 1 transaction
    const participantIds = new Set(entries.map((e) => e.membershipId));

    // Membres ayant payé leur cotisation
    const cotisantIds = new Set(
      entries.filter((e) => e.type === TransactionType.COTISATION).map((e) => e.membershipId),
    );

    // Membres inscrits sans cotisation
    const absentMembers = (memberships ?? []).filter(
      (m) => !cotisantIds.has(m.id),
    );

    // Total remboursements
    const totalRbt =
      parseFloat(session.totalRbtPrincipal || '0') +
      parseFloat(session.totalRbtInterest || '0');

    // Taux cotisation
    const total = memberships?.length ?? 0;
    const pct = total > 0 ? Math.round((cotisantIds.size / total) * 100) : 0;

    // Pie data
    const pieData = [
      { name: TRANSACTION_TYPE_LABELS[TransactionType.COTISATION],    value: parseFloat(session.totalCotisation || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.POT],           value: parseFloat(session.totalPot || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.INSCRIPTION],   value: parseFloat(session.totalInscription || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.SECOURS],       value: parseFloat(session.totalSecours || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.RBT_PRINCIPAL], value: parseFloat(session.totalRbtPrincipal || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.RBT_INTEREST],  value: parseFloat(session.totalRbtInterest || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.EPARGNE],       value: parseFloat(session.totalEpargne || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.PROJET],        value: parseFloat(session.totalProjet || '0') },
      { name: TRANSACTION_TYPE_LABELS[TransactionType.AUTRES],        value: parseFloat(session.totalAutres || '0') },
    ].filter((d) => d.value > 0);

    return { totalGeneral, participantIds, cotisantIds, absentMembers, totalRbt, pct, pieData };
  }, [session, memberships]);

  // Bénéficiaires de cette session (plusieurs slots possibles)
  const beneficiarySlots: BeneficiarySlot[] = useMemo(() => {
    if (!schedule?.slots || !session) return [];
    return schedule.slots.filter((s) => s.sessionId === params.id);
  }, [schedule, session, params.id]);

  const handleOpen = async () => { await openSession.mutateAsync(params.id); };
  const handleCloseForReview = async () => { await closeForReview.mutateAsync(params.id); };
  const handleValidate = async () => {
    await validateAndClose.mutateAsync(params.id);
    // Après clôture, vérifier si des bénéficiaires n'ont pas encore reçu leur pot
    const undelivered = beneficiarySlots.filter((s) => s.status === 'ASSIGNED');
    if (undelivered.length > 0) {
      // Le toast est déjà affiché par le hook ; on affiche un rappel supplémentaire
      import('react-hot-toast').then(({ default: toast }) => {
        toast(
          `⚠ ${undelivered.length} bénéficiaire${undelivered.length > 1 ? 's' : ''} en attente de remise du pot.`,
          { duration: 6000, icon: '🎁' },
        );
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (isError || !session || !derived) {
    return <div className="flex items-center justify-center py-24 text-red-500 text-sm">Session introuvable.</div>;
  }

  const currentOrder = STATUS_ORDER[session.status] ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Session #${session.sessionNumber} — ${new Date(session.meetingDate).toLocaleDateString('fr-FR', { month: 'long' })}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Sessions', href: '/sessions' },
          { label: `Session #${session.sessionNumber} — ${new Date(session.meetingDate).toLocaleDateString('fr-FR', { month: 'long' })}` },
        ]}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportSessionDetailToPdf(session, session.fiscalYear?.label ?? '')}
              className="flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
            {session.status === 'DRAFT' && canOpenSession && (
              <Button size="sm" onClick={() => setConfirmOpen(true)} isLoading={openSession.isPending}>
                Ouvrir la session
              </Button>
            )}
            {session.status === 'OPEN' && isTresorier && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setShowBatchModal(true)}>
                  + Saisie rapide
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowTransactionModal(true)}>
                  + Transaction
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

      {/* ── KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Participants"
          value={derived.participantIds.size}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          sub={memberships ? `sur ${memberships.length} membres` : undefined}
        />
        <KpiCard
          label="Transactions"
          value={session.entries?.length ?? 0}
          icon={CreditCard}
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Taux cotisation"
          value={`${derived.pct} %`}
          icon={TrendingUp}
          color={derived.pct === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}
          sub={`${derived.cotisantIds.size} / ${memberships?.length ?? '?'}`}
        />
        <KpiCard
          label="Remboursements"
          value={`${derived.totalRbt.toLocaleString('fr-FR')} XAF`}
          icon={Banknote}
          color="bg-rose-50 text-rose-600"
          sub="Principal + Intérêts"
        />
      </div>

      {/* ── Timeline statut + Bénéficiaire ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline workflow */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">Progression de la session</p>
          <div className="flex items-start gap-0">
            {WORKFLOW.map((step, i) => {
              const done = i < currentOrder;
              const active = i === currentOrder;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center">
                  {/* Connecteur + cercle */}
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div className={`flex-1 h-0.5 ${done || active ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      done    ? 'bg-blue-500' :
                      active  ? 'bg-blue-100 ring-2 ring-blue-500' :
                                'bg-gray-100'
                    }`}>
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-white" />
                        : active
                        ? <Clock className="h-4 w-4 text-blue-600" />
                        : <Circle className="h-4 w-4 text-gray-300" />}
                    </div>
                    {i < WORKFLOW.length - 1 && (
                      <div className={`flex-1 h-0.5 ${done ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <p className={`text-[10px] font-medium text-center mt-1.5 px-1 leading-tight ${
                    active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {step.label}
                  </p>
                  {/* Timestamp */}
                  {step.key === 'OPEN' && session.openedAt && (
                    <p className="text-[9px] text-gray-400 mt-0.5 text-center">
                      {new Date(session.openedAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                  {step.key === 'CLOSED' && session.closedAt && (
                    <p className="text-[9px] text-gray-400 mt-0.5 text-center">
                      {new Date(session.closedAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Infos complémentaires */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Date de réunion</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {new Date(session.meetingDate).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lieu</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {session.location ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total collecté</p>
              <p className="text-sm font-semibold text-gray-900 tabular-nums mt-0.5">
                {derived.totalGeneral.toLocaleString('fr-FR')} XAF
              </p>
            </div>
          </div>
        </div>

        {/* Bénéficiaires du mois (multi-slots) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-teal-600" />
              <p className="text-sm font-semibold text-gray-800">
                Bénéficiaire{beneficiarySlots.length > 1 ? 's' : ''} du mois
                {beneficiarySlots.length > 0 && (
                  <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                    {beneficiarySlots.length}
                  </span>
                )}
              </p>
            </div>
            {session.status === 'OPEN' && isPresident && (
              <button
                onClick={() => addSlot.mutate(params.id)}
                disabled={addSlot.isPending}
                className="text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                + Ajouter
              </button>
            )}
          </div>

          {beneficiarySlots.length > 0 ? (
            <div className="space-y-3">
              {beneficiarySlots.map((slot, i) => (
                <div key={slot.id} className={`${i > 0 ? 'border-t border-gray-100 pt-3' : ''}`}>
                  {/* Slot UNASSIGNED — picker membre */}
                  {slot.status === 'UNASSIGNED' && session.status === 'OPEN' && isPresident ? (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Slot #{slot.slotIndex} — Non attribué</p>
                      <div className="flex gap-2 items-start">
                        <Select
                          value={assignMembershipId[slot.id] ?? ''}
                          onChange={(e) =>
                            setAssignMembershipId((prev) => ({ ...prev, [slot.id]: e.target.value }))
                          }
                          className="flex-1 text-xs py-1.5 px-2"
                        >
                          <option value="">Sélectionner un membre…</option>
                          {memberships?.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.profile?.lastName} {m.profile?.firstName}
                            </option>
                          ))}
                        </Select>
                        <button
                          onClick={() => {
                            const mid = assignMembershipId[slot.id];
                            if (!mid) return;
                            assignSlot.mutate({ slotId: slot.id, membershipId: mid });
                            setAssignMembershipId((prev) => ({ ...prev, [slot.id]: '' }));
                          }}
                          disabled={!assignMembershipId[slot.id] || assignSlot.isPending}
                          className="text-xs font-medium bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors"
                        >
                          Assigner
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-400">
                          Slot #{slot.slotIndex}
                          {slot.isHost && (
                            <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                              Hôte
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {slot.membership?.profile
                            ? `${slot.membership.profile.lastName} ${slot.membership.profile.firstName}`
                            : <span className="text-gray-400 italic text-xs">Non désigné</span>}
                        </p>
                        {slot.status === 'DELIVERED' && parseFloat(slot.amountDelivered || '0') > 0 && (
                          <p className="text-sm font-bold text-teal-700 tabular-nums mt-0.5">
                            {parseFloat(slot.amountDelivered).toLocaleString('fr-FR')} XAF
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          slot.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700'
                          : slot.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                        }`}>
                          {slot.status === 'DELIVERED' ? 'Livré ✓' : slot.status === 'ASSIGNED' ? 'En attente' : 'Non attribué'}
                        </span>
                        {slot.status === 'ASSIGNED' && isPresident && (
                          <button
                            onClick={() => { setDeliverySlotId(slot.id); setDeliveryAmount(''); }}
                            className="text-[11px] font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full transition-colors"
                          >
                            Confirmer remise
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Hôte toggle — visible si ≥ 2 slots ASSIGNED */}
              {beneficiarySlots.filter((s) => s.status === 'ASSIGNED').length >= 2 && session.status === 'OPEN' && isPresident && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">Hôte de la réunion :</p>
                  <div className="space-y-1.5">
                    {beneficiarySlots
                      .filter((s) => s.status === 'ASSIGNED' || s.status === 'DELIVERED')
                      .map((s) => (
                        <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="host"
                            checked={s.isHost}
                            onChange={() => setHost.mutate(s.id)}
                            className="text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-xs text-gray-700">
                            {s.membership?.profile
                              ? `${s.membership.profile.lastName} ${s.membership.profile.firstName}`
                              : `Slot #${s.slotIndex}`}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Gift className="h-8 w-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">Aucun bénéficiaire pour cette session</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Taux de participation (barre) ── */}
      {memberships && memberships.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800">Taux de cotisation</p>
            <span className={`text-sm font-bold tabular-nums ${derived.pct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {derived.pct} % ({derived.cotisantIds.size}/{memberships.length})
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${derived.pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${derived.pct}%` }}
            />
          </div>

          {/* Membres sans cotisation */}
          {derived.absentMembers.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs font-medium text-amber-700">
                  {derived.absentMembers.length} membre{derived.absentMembers.length > 1 ? 's' : ''} sans cotisation
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {derived.absentMembers.map((m) => (
                  <span
                    key={m.id}
                    className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full"
                  >
                    {m.profile
                      ? `${m.profile.lastName} ${m.profile.firstName}`
                      : m.id.slice(-6)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal transaction simple ── */}
      <TransactionModal
        open={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        sessionId={params.id}
        memberships={memberships ?? []}
        config={session.fiscalYear?.config}
        entries={session.entries ?? []}
      />

      {/* ── Modal saisie batch ── */}
      <BatchTransactionModal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        sessionId={params.id}
        memberships={memberships ?? []}
        config={session.fiscalYear?.config}
        entries={session.entries ?? []}
      />

      {/* ── Totaux + Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Détail textuel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Totaux par type</h2>
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
          {derived.totalGeneral === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune transaction enregistrée.</p>
          )}
        </div>

        {/* Donut répartition */}
        {derived.pieData.length > 0 && (
          <ChartCard title="Répartition des collectes" subtitle={`Total : ${derived.totalGeneral.toLocaleString('fr-FR')} XAF`}>
            <div className="h-64 px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={derived.pieData}
                    cx="50%"
                    cy="44%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {derived.pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v.toLocaleString('fr-FR')} XAF`]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      {/* ── Journal financier ── */}
      {derived.totalGeneral > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">Journal financier de la session</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Rubrique</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Montant (XAF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {/* RECETTES */}
                <tr className="bg-emerald-50/40">
                  <td colSpan={2} className="px-6 py-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                    Recettes
                  </td>
                </tr>
                {[
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.COTISATION], value: session.totalCotisation },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.EPARGNE], value: session.totalEpargne },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.SECOURS], value: session.totalSecours },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.PROJET], value: session.totalProjet },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.POT], value: session.totalPot },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.RBT_PRINCIPAL], value: session.totalRbtPrincipal },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.RBT_INTEREST], value: session.totalRbtInterest },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.INSCRIPTION], value: session.totalInscription },
                  { label: TRANSACTION_TYPE_LABELS[TransactionType.AUTRES], value: session.totalAutres },
                ]
                  .filter((r) => parseFloat(r.value || '0') > 0)
                  .map((r) => (
                    <tr key={r.label} className="hover:bg-gray-50">
                      <td className="px-6 py-2.5 text-gray-600 pl-10">{r.label}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums font-medium text-gray-800">
                        {parseFloat(r.value || '0').toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                <tr className="border-t border-emerald-100 bg-emerald-50/60">
                  <td className="px-6 py-2.5 text-sm font-bold text-emerald-800">Total Recettes</td>
                  <td className="px-6 py-2.5 text-right tabular-nums font-bold text-emerald-800">
                    {derived.totalGeneral.toLocaleString('fr-FR')}
                  </td>
                </tr>

                {/* DÉPENSES */}
                <tr className="bg-rose-50/40">
                  <td colSpan={2} className="px-6 py-2 text-xs font-bold text-rose-700 uppercase tracking-wide">
                    Dépenses
                  </td>
                </tr>
                {beneficiarySlots.filter((s) => s.status === 'DELIVERED' && parseFloat(s.amountDelivered || '0') > 0).length > 0 ? (
                  <>
                    {beneficiarySlots
                      .filter((s) => s.status === 'DELIVERED' && parseFloat(s.amountDelivered || '0') > 0)
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-2.5 text-gray-600 pl-10">
                            Tontine versée — {s.membership?.profile
                              ? `${s.membership.profile.lastName} ${s.membership.profile.firstName}`
                              : `Slot #${s.slotIndex}`}
                          </td>
                          <td className="px-6 py-2.5 text-right tabular-nums font-medium text-rose-700">
                            {parseFloat(s.amountDelivered || '0').toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                  </>
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-2.5 text-xs text-gray-400 pl-10 italic">Aucune tontine versée pour cette session</td>
                  </tr>
                )}
                {(() => {
                  const totalDepenses = beneficiarySlots
                    .filter((s) => s.status === 'DELIVERED')
                    .reduce((sum, s) => sum + parseFloat(s.amountDelivered || '0'), 0);
                  const solde = derived.totalGeneral - totalDepenses;
                  return (
                    <>
                      <tr className="border-t border-rose-100 bg-rose-50/60">
                        <td className="px-6 py-2.5 text-sm font-bold text-rose-800">Total Dépenses</td>
                        <td className="px-6 py-2.5 text-right tabular-nums font-bold text-rose-800">
                          {totalDepenses.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                      <tr className="border-t-2 border-gray-200 bg-blue-50/50">
                        <td className="px-6 py-3 text-sm font-bold text-blue-900">Solde en caisse</td>
                        <td className={`px-6 py-3 text-right tabular-nums text-base font-bold ${solde >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                          {solde.toLocaleString('fr-FR')} XAF
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tableau des transactions ── */}
      {session.entries && session.entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">
              Transactions ({session.entries.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Référence</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Montant</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Date</th>
                {session.status !== 'CLOSED' && isTresorier && (
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {session.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-gray-400">{entry.reference}</td>
                  <td className="px-6 py-3 text-gray-700">
                    {entry.membership?.profile
                      ? `${entry.membership.profile.lastName} ${entry.membership.profile.firstName}`
                      : entry.membershipId.slice(-8)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {TRANSACTION_TYPE_LABELS[entry.type as TransactionType] ?? entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold text-gray-900">
                    {parseFloat(entry.amount).toLocaleString('fr-FR')} XAF
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-gray-400">
                    {new Date(entry.recordedAt).toLocaleDateString('fr-FR')}
                  </td>
                  {session.status !== 'CLOSED' && isTresorier && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          title="Modifier"
                          onClick={() => {
                            setEditEntry(entry);
                            setEditAmount(entry.amount);
                            setEditNotes(entry.notes ?? '');
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => setDeleteEntryId(entry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                <td className="px-6 py-3 text-right text-sm font-bold text-gray-900 tabular-nums">
                  {derived.totalGeneral.toLocaleString('fr-FR')} XAF
                </td>
                <td />
                {session.status !== 'CLOSED' && isTresorier && <td />}
              </tr>
            </tfoot>
          </table>
          </div>
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

      {/* ── Modale Edit transaction ── */}
      <Modal
        isOpen={Boolean(editEntry)}
        onClose={() => setEditEntry(null)}
        title="Modifier la transaction"
        size="sm"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setEditEntry(null)}>Annuler</Button>
            <Button
              isLoading={updateEntry.isPending}
              onClick={() => {
                if (!editEntry) return;
                const amount = parseFloat(editAmount);
                if (!isNaN(amount) && amount > 0) {
                  updateEntry.mutate(
                    { entryId: editEntry.id, payload: { amount, notes: editNotes || undefined } },
                    { onSuccess: () => setEditEntry(null) },
                  );
                }
              }}
            >
              Enregistrer
            </Button>
          </>
        )}
      >
        {editEntry && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Type</p>
              <span className="text-sm font-medium text-gray-800">
                {TRANSACTION_TYPE_LABELS[editEntry.type as TransactionType] ?? editEntry.type}
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Montant (XAF)</label>
              <input
                type="number"
                min="1"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Notes (optionnel)</label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Commentaire libre"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Confirm suppression transaction ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteEntryId)}
        title="Supprimer cette transaction ?"
        message="Cette action annulera les effets de cette transaction (épargne, caisse de secours). Irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteEntryMutation.isPending}
        onConfirm={() => {
          if (deleteEntryId) {
            deleteEntryMutation.mutate(deleteEntryId, { onSuccess: () => setDeleteEntryId(null) });
          }
        }}
        onCancel={() => setDeleteEntryId(null)}
      />

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
    </div>
  );
}
