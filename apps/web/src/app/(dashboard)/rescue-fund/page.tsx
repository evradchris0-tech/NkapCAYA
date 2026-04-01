'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import ChartCard from '@components/ui/ChartCard';
import { useRescueFundLedger, useRescueFundEvents, useRecordRescueEvent } from '@lib/hooks/useRescueFund';
import { useFiscalYearMemberships } from '@lib/hooks/useFiscalYear';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { RescueEventType } from '@/types/api.types';
import {
  RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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
  const { selectedFyId, isReadOnly } = useFiscalYearContext();
  const { data: memberships } = useFiscalYearMemberships(selectedFyId);
  const { data: ledger, isLoading: ledgerLoading } = useRescueFundLedger(selectedFyId);
  const { data: events } = useRescueFundEvents(selectedFyId);
  const recordEvent = useRecordRescueEvent(selectedFyId);

  const [showForm, setShowForm] = useState(false);

  const canRecord =
    !isReadOnly && (
      currentUser?.role === BureauRole.PRESIDENT ||
      currentUser?.role === BureauRole.VICE_PRESIDENT ||
      currentUser?.role === BureauRole.SUPER_ADMIN
    );

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

  if (!selectedFyId) {
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
            <Select
              id="rf-member"
              label="Bénéficiaire"
              {...register('beneficiaryMembershipId')}
              error={errors.beneficiaryMembershipId?.message}
            >
              <option value="">Sélectionner…</option>
              {memberships?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.profile?.lastName} {m.profile?.firstName} — {m.profile?.memberCode}
                </option>
              ))}
            </Select>

            <Select
              id="rf-type"
              label="Type d'événement"
              {...register('eventType')}
              error={errors.eventType?.message}
            >
              <option value="">Sélectionner…</option>
              {(Object.keys(EVENT_TYPE_LABELS) as RescueEventType[]).map((t) => (
                <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
              ))}
            </Select>

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

      {/* KPI solde + graphes */}
      {ledgerLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Chargement…</div>
      ) : ledger ? (() => {
        const balance = parseFloat(ledger.totalBalance);
        const target  = parseFloat(ledger.targetPerMember);
        const minimum = parseFloat(ledger.minimumPerMember);
        const memberCount = ledger.memberCount || 1;
        // Solde moyen par membre vs objectif par membre
        const avgPerMember = balance / memberCount;
        const pct = target > 0 ? Math.min((avgPerMember / target) * 100, 100) : 0;
        const gaugeColor = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

        const eventCounts: Record<string, number> = {};
        (events ?? []).forEach((e) => {
          eventCounts[EVENT_TYPE_LABELS[e.eventType]] = (eventCounts[EVENT_TYPE_LABELS[e.eventType]] || 0) + 1;
        });
        const eventPieData = Object.entries(eventCounts).map(([name, value]) => ({ name, value }));
        const PIE_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#f43f5e','#14b8a6'];

        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Solde actuel',         value: `${balance.toLocaleString('fr-FR')} XAF` },
                { label: 'Solde moyen / membre', value: `${avgPerMember.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} XAF` },
                { label: 'Objectif / membre',    value: `${target.toLocaleString('fr-FR')} XAF` },
                { label: 'Minimum / membre',     value: `${minimum.toLocaleString('fr-FR')} XAF` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="font-semibold text-gray-900 tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gauge remplissage */}
              <ChartCard title="Niveau de la caisse par membre" subtitle={`Moy. ${avgPerMember.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} XAF / objectif ${target.toLocaleString('fr-FR')} XAF`}>
                <div className="h-52 flex flex-col items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%" cy="68%"
                      innerRadius="55%" outerRadius="80%"
                      startAngle={180} endAngle={0}
                      data={[{ value: pct, fill: gaugeColor }]}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={6} angleAxisId={0} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-10 text-center pointer-events-none">
                    <p className="text-2xl font-bold tabular-nums" style={{ color: gaugeColor }}>{pct.toFixed(0)} %</p>
                    <p className="text-xs text-gray-400 mt-0.5">{balance.toLocaleString('fr-FR')} XAF</p>
                  </div>
                </div>
              </ChartCard>

              {/* Donut types d'événements */}
              {eventPieData.length > 0 ? (
                <ChartCard title="Répartition des décaissements" subtitle={`${(events ?? []).length} événement${(events?.length ?? 0) > 1 ? 's' : ''}`}>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={eventPieData} cx="50%" cy="42%" innerRadius={44} outerRadius={68} paddingAngle={3} dataKey="value">
                          {eventPieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number, n: string) => [`${v} événement${v > 1 ? 's' : ''}`, n]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={7} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center text-gray-300 text-sm">
                  Aucun décaissement enregistré
                </div>
              )}
            </div>

            {/* Membres avec dette de reconstitution */}
            {(() => {
              const positions = ledger.positions ?? [];
              const debtors = positions
                .filter((p) => parseFloat(p.refillDebt) > 0)
                .map((p) => {
                  const m = (memberships ?? []).find((mb) => mb.id === p.membershipId);
                  return {
                    name: m?.profile ? `${m.profile.lastName} ${m.profile.firstName}` : p.membershipId.slice(-6),
                    code: m?.profile?.memberCode ?? '—',
                    paidAmount: parseFloat(p.paidAmount),
                    balance: parseFloat(p.balance),
                    refillDebt: parseFloat(p.refillDebt),
                  };
                })
                .sort((a, b) => b.refillDebt - a.refillDebt);

              if (debtors.length === 0) return null;

              const totalDebt = debtors.reduce((s, d) => s + d.refillDebt, 0);

              return (
                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-amber-800">Reconstitution en attente</h2>
                      <p className="text-xs text-amber-600 mt-0.5">
                        {debtors.length} membre{debtors.length > 1 ? 's' : ''} doivent encore alimenter la caisse
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-700 tabular-nums">
                      Total dû : {totalDebt.toLocaleString('fr-FR')} XAF
                    </span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-amber-50/60 border-b border-amber-100">
                      <tr>
                        <th className="text-left px-6 py-3 font-medium text-gray-600">Membre</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-600">Code</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-600">Versé</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-600">Solde position</th>
                        <th className="text-right px-6 py-3 font-medium text-amber-700">Dette restante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {debtors.map((d, i) => (
                        <tr key={i} className="hover:bg-amber-50/40">
                          <td className="px-6 py-3 font-medium text-gray-900">{d.name}</td>
                          <td className="px-6 py-3 text-gray-500 font-mono text-xs">{d.code}</td>
                          <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                            {d.paidAmount.toLocaleString('fr-FR')} XAF
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-gray-700">
                            {d.balance.toLocaleString('fr-FR')} XAF
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums font-semibold text-amber-700">
                            {d.refillDebt.toLocaleString('fr-FR')} XAF
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </>
        );
      })() : null}

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
