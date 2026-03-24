'use client';

import { useMemo } from 'react';
import { Activity, Calendar, Users, CreditCard, Shield, Gavel } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import { Skeleton } from '@components/ui/Skeleton';
import type { LucideIcon } from 'lucide-react';

interface AuditEvent {
  id: string;
  date: Date;
  category: string;
  icon: LucideIcon;
  color: string;
  action: string;
  detail?: string;
}

const CAT_COLORS: Record<string, string> = {
  'Exercice': 'bg-violet-100 text-violet-700',
  'Session':  'bg-blue-100 text-blue-700',
  'Clôture':  'bg-amber-100 text-amber-700',
  'Validation': 'bg-emerald-100 text-emerald-700',
  'Cassation': 'bg-rose-100 text-rose-700',
};

export default function AuditPage() {
  const { selectedFyId, selectedFy, fiscalYears, setSelectedFyId } = useFiscalYearContext();
  const { data: sessions, isLoading } = useSessionsByFiscalYear(selectedFyId);

  const events = useMemo<AuditEvent[]>(() => {
    const list: AuditEvent[] = [];

    // Exercice fiscal — activation
    if (selectedFy) {
      list.push({
        id: `fy-start-${selectedFy.id}`,
        date: new Date(selectedFy.startDate),
        category: 'Exercice',
        icon: Calendar,
        color: CAT_COLORS['Exercice'],
        action: `Exercice ${selectedFy.label} — début`,
        detail: `Statut : ${selectedFy.status}`,
      });
    }

    // Sessions
    (sessions ?? []).forEach((s) => {
      // Ouverture
      if (s.openedAt) {
        list.push({
          id: `session-open-${s.id}`,
          date: new Date(s.openedAt),
          category: 'Session',
          icon: Activity,
          color: CAT_COLORS['Session'],
          action: `Session #${s.sessionNumber} — ouverte`,
          detail: `Réunion du ${new Date(s.meetingDate).toLocaleDateString('fr-FR')}`,
        });
      }
      // Clôture / Révision — utilise closedAt (statut REVIEWING ou CLOSED)
      if (s.closedAt && s.status === 'REVIEWING') {
        list.push({
          id: `session-review-${s.id}`,
          date: new Date(s.closedAt),
          category: 'Clôture',
          icon: Shield,
          color: CAT_COLORS['Clôture'],
          action: `Session #${s.sessionNumber} — soumise pour révision`,
        });
      }
      // Validation finale
      if (s.closedAt && s.status === 'CLOSED') {
        list.push({
          id: `session-valid-${s.id}`,
          date: new Date(s.closedAt),
          category: 'Validation',
          icon: Gavel,
          color: CAT_COLORS['Validation'],
          action: `Session #${s.sessionNumber} — validée et clôturée`,
          detail: `Total collecté : ${[
            s.totalCotisation, s.totalPot, s.totalInscription, s.totalSecours,
            s.totalRbtPrincipal, s.totalRbtInterest, s.totalEpargne, s.totalProjet, s.totalAutres,
          ].reduce((sum, v) => sum + parseFloat(v || '0'), 0).toLocaleString('fr-FR')} XAF`,
        });
      }
    });

    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedFy, sessions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Historique des actions"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Audit' }]}
      />

      {/* Sélecteur exercice */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Exercice :</label>
        <select
          value={selectedFyId}
          onChange={(e) => setSelectedFyId(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
        >
          {fiscalYears?.map((fy) => (
            <option key={fy.id} value={fy.id}>{fy.label} — {fy.status}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">{events.length} événement{events.length > 1 ? 's' : ''}</span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Aucun événement enregistré pour cet exercice.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event, i) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Icône */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${event.color}`}>
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.action}</p>
                    {event.detail && (
                      <p className="text-xs text-gray-400 mt-0.5">{event.detail}</p>
                    )}
                  </div>

                  {/* Date + badge */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-gray-600">
                      {event.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {event.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${event.color}`}>
                      {event.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
