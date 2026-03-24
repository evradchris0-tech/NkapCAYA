'use client';

import { useMemo, useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import ChartCard from '@components/ui/ChartCard';
import TransactionForm from '@components/forms/TransactionForm';
import { Skeleton } from '@components/ui/Skeleton';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Users, CreditCard, TrendingUp, Banknote,
  CheckCircle2, Clock, Circle, Gift, AlertTriangle,
} from 'lucide-react';
import { useSession, useOpenSession, useCloseForReview, useValidateAndClose } from '@lib/hooks/useSessions';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole, TRANSACTION_TYPE_LABELS, TransactionType } from '@/types/domain.types';
import type { BeneficiarySlot } from '@/types/api.types';

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
  const [showForm, setShowForm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReview, setConfirmReview] = useState(false);
  const [confirmValidate, setConfirmValidate] = useState(false);

  const { data: memberships } = useFiscalYearMemberships(session?.fiscalYearId ?? '');
  const { data: schedule } = useBeneficiarySchedule(session?.fiscalYearId ?? '');

  const isTresorier =
    currentUser?.role === BureauRole.TRESORIER ||
    currentUser?.role === BureauRole.SUPER_ADMIN;
  const isPresident =
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.SUPER_ADMIN;

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

    // Bar data — cotisation par membre
    const cotisationMap: Record<string, { name: string; montant: number }> = {};
    entries
      .filter((e) => e.type === TransactionType.COTISATION)
      .forEach((e) => {
        const name = e.membership
          ? `${e.membership.lastName} ${e.membership.firstName}`.trim()
          : e.membershipId.slice(-6);
        if (!cotisationMap[e.membershipId]) {
          cotisationMap[e.membershipId] = { name, montant: 0 };
        }
        cotisationMap[e.membershipId].montant += parseFloat(e.amount);
      });
    const barData = Object.values(cotisationMap).sort((a, b) => b.montant - a.montant);

    return { totalGeneral, participantIds, cotisantIds, absentMembers, totalRbt, pct, pieData, barData };
  }, [session, memberships]);

  // Bénéficiaire de cette session
  const beneficiarySlot: BeneficiarySlot | undefined = useMemo(() => {
    if (!schedule?.slots || !session) return undefined;
    return schedule.slots.find((s) => s.sessionId === params.id);
  }, [schedule, session, params.id]);

  const handleOpen = async () => { await openSession.mutateAsync(params.id); };
  const handleCloseForReview = async () => { await closeForReview.mutateAsync(params.id); };
  const handleValidate = async () => { await validateAndClose.mutateAsync(params.id); };

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
              const upcoming = i > currentOrder;
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

        {/* Bénéficiaire du mois */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-teal-600" />
            <p className="text-sm font-semibold text-gray-800">Bénéficiaire du mois</p>
          </div>
          {beneficiarySlot ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Membre désigné</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {beneficiarySlot.membership?.profile
                    ? `${beneficiarySlot.membership.profile.lastName} ${beneficiarySlot.membership.profile.firstName}`
                    : '—'}
                </p>
                {beneficiarySlot.membership?.profile?.memberCode && (
                  <p className="text-xs font-mono text-gray-400">{beneficiarySlot.membership.profile.memberCode}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Montant livré</p>
                <p className="text-lg font-bold text-teal-700 tabular-nums mt-0.5">
                  {parseFloat(beneficiarySlot.amountDelivered || '0').toLocaleString('fr-FR')} XAF
                </p>
              </div>
              <span className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full ${
                beneficiarySlot.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-700'
                  : beneficiarySlot.status === 'ASSIGNED'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {beneficiarySlot.status === 'DELIVERED' ? 'Livré'
                  : beneficiarySlot.status === 'ASSIGNED' ? 'Désigné'
                  : 'Non attribué'}
              </span>
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

      {/* ── Bar chart cotisation par membre ── */}
      {derived.barData.length > 0 && (
        <ChartCard title="Cotisation par membre" subtitle="Montants en XAF">
          <div style={{ height: Math.max(200, derived.barData.length * 36) }} className="px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.barData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString('fr-FR')} XAF`, 'Cotisation']}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="montant" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {/* ── Tableau des transactions ── */}
      {session.entries && session.entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800">
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
                <th className="text-right px-6 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {session.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-gray-400">{entry.reference}</td>
                  <td className="px-6 py-3 text-gray-700">
                    {entry.membership
                      ? `${entry.membership.lastName} ${entry.membership.firstName}`
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
              </tr>
            </tfoot>
          </table>
        </div>
      )}

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
