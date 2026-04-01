'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@components/layout/PageHeader';
import Select from '@components/ui/Select';
import { SkeletonRow } from '@components/ui/Skeleton';
import { useFiscalYears } from '@lib/hooks/useFiscalYear';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import type { FiscalYearStatus, MonthlySession } from '@/types/api.types';

const SESSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  OPEN: 'Ouverte',
  REVIEWING: 'En révision',
  CLOSED: 'Clôturée',
};

const SESSION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  OPEN: 'bg-green-100 text-green-700',
  REVIEWING: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-blue-100 text-blue-700',
};

const FY_STATUS_PRIORITY: FiscalYearStatus[] = ['ACTIVE', 'CASSATION', 'PENDING', 'CLOSED', 'ARCHIVED'];

function SessionRow({ session, index }: { session: MonthlySession; index: number }) {
  const total = [
    session.totalCotisation,
    session.totalPot,
    session.totalInscription,
    session.totalSecours,
    session.totalRbtPrincipal,
    session.totalRbtInterest,
    session.totalEpargne,
    session.totalProjet,
    session.totalAutres,
  ].reduce((sum, v) => sum + parseFloat(v || '0'), 0);

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-3 text-gray-400 text-xs tabular-nums w-10">{index + 1}</td>
      <td className="px-6 py-3 font-medium text-gray-900">
        Session #{session.sessionNumber}
      </td>
      <td className="px-6 py-3 text-gray-600">
        {new Date(session.meetingDate).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        })}
      </td>
      <td className="px-6 py-3">
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${SESSION_STATUS_COLORS[session.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {SESSION_STATUS_LABELS[session.status] ?? session.status}
        </span>
      </td>
      <td className="px-6 py-3 text-right text-gray-700 tabular-nums">
        {total > 0 ? total.toLocaleString('fr-FR') + ' XAF' : '—'}
      </td>
      <td className="px-6 py-3 text-right">
        <Link
          href={`/sessions/${session.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
        >
          Voir →
        </Link>
      </td>
    </tr>
  );
}

export default function SessionsPage() {
  const { data: fiscalYears } = useFiscalYears();

  const defaultFy = fiscalYears?.sort(
    (a, b) =>
      FY_STATUS_PRIORITY.indexOf(a.status) - FY_STATUS_PRIORITY.indexOf(b.status),
  )[0];

  const [selectedFyId, setSelectedFyId] = useState<string>('');
  const activeFyId = selectedFyId || defaultFy?.id || '';

  const { data: sessions, isLoading } = useSessionsByFiscalYear(activeFyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions mensuelles"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Sessions' }]}
      />

      {/* Sélecteur exercice fiscal */}
      {fiscalYears && fiscalYears.length > 0 && (
        <div className="flex items-center gap-3">
          <Select
            id="fy-select"
            value={activeFyId}
            onChange={(e) => setSelectedFyId(e.target.value)}
            className="py-1.5 w-52"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label} — {fy.status}
              </option>
            ))}
          </Select>
        </div>
      )}

      {!activeFyId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          Aucun exercice fiscal trouvé. Créez et activez un exercice d&apos;abord.
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600 w-10">#</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Session</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Date prévue</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Total collecté</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          Aucune session. Activez l&apos;exercice fiscal pour générer les 12 sessions.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Session</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Date prévue</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Statut</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-600">Total collecté</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s, i) => (
                  <SessionRow key={s.id} session={s} index={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
