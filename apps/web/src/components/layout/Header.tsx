'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Clock, AlertCircle, Gift, Gavel, X } from 'lucide-react';
import { useCurrentUser, useLogout } from '@lib/hooks/useCurrentUser';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';

function avatarColor(initials: string): string {
  const colors = [
    'bg-blue-600 text-blue-100',
    'bg-violet-600 text-violet-100',
    'bg-emerald-600 text-emerald-100',
    'bg-amber-600 text-amber-100',
    'bg-rose-600 text-rose-100',
    'bg-cyan-600 text-cyan-100',
  ];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % colors.length;
  return colors[idx];
}

const ROLE_BADGE_COLORS: Partial<Record<BureauRole, string>> = {
  [BureauRole.SUPER_ADMIN]:             'bg-violet-100 text-violet-700',
  [BureauRole.PRESIDENT]:               'bg-blue-100 text-blue-700',
  [BureauRole.VICE_PRESIDENT]:          'bg-blue-100 text-blue-600',
  [BureauRole.TRESORIER]:               'bg-emerald-100 text-emerald-700',
  [BureauRole.SECRETAIRE_GENERAL]:      'bg-amber-100 text-amber-700',
  [BureauRole.SECRETAIRE_ADJOINT]:      'bg-amber-100 text-amber-600',
  [BureauRole.COMMISSAIRE_AUX_COMPTES]: 'bg-gray-100 text-gray-700',
  [BureauRole.MEMBRE]:                  'bg-gray-100 text-gray-500',
};

const BADGE_STYLES = {
  warning: 'bg-amber-100 text-amber-700',
  info:    'bg-blue-100 text-blue-700',
  danger:  'bg-red-100 text-red-700',
};

type NotifBadge = 'warning' | 'info' | 'danger';

interface Notification {
  id: string;
  icon: React.ReactNode;
  color: string;
  message: string;
  href?: string;
  badge: NotifBadge;
}

export default function Header() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { selectedFyId, selectedFy, setSelectedFyId, fiscalYears } = useFiscalYearContext();
  const { data: sessions } = useSessionsByFiscalYear(selectedFyId);
  const { data: schedule } = useBeneficiarySchedule(selectedFyId);

  const [showNotifPanel, setShowNotifPanel] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    if (!showNotifPanel) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifPanel]);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

    // Sessions OPEN
    const openSessions = sessions?.filter((s) => s.status === 'OPEN') ?? [];
    for (const s of openSessions) {
      items.push({
        id: `open-${s.id}`,
        icon: <Clock className="h-4 w-4 shrink-0" />,
        color: 'text-amber-500',
        message: `Session #${s.sessionNumber} en cours`,
        href: `/sessions/${s.id}`,
        badge: 'warning',
      });
    }

    // Sessions REVIEWING
    const reviewingSessions = sessions?.filter((s) => s.status === 'REVIEWING') ?? [];
    for (const s of reviewingSessions) {
      items.push({
        id: `reviewing-${s.id}`,
        icon: <AlertCircle className="h-4 w-4 shrink-0" />,
        color: 'text-blue-500',
        message: `Session #${s.sessionNumber} attend validation`,
        href: `/sessions/${s.id}`,
        badge: 'info',
      });
    }

    // Unassigned beneficiary slots
    const unassignedCount = schedule?.slots?.filter((sl) => sl.status === 'UNASSIGNED').length ?? 0;
    if (unassignedCount > 0) {
      items.push({
        id: 'unassigned-slots',
        icon: <Gift className="h-4 w-4 shrink-0" />,
        color: 'text-amber-500',
        message: `${unassignedCount} slot(s) bénéficiaire non attribués`,
        href: '/beneficiaries',
        badge: 'warning',
      });
    }

    // Cassation within 30 days
    if (selectedFy?.cassationDate) {
      const daysLeft = Math.ceil(
        (new Date(selectedFy.cassationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft >= 0 && daysLeft <= 30) {
        items.push({
          id: 'cassation-soon',
          icon: <Gavel className="h-4 w-4 shrink-0" />,
          color: 'text-red-500',
          message: `Cassation dans ${daysLeft} jour${daysLeft !== 1 ? 's' : ''}`,
          badge: 'danger',
        });
      }
    }

    return items;
  }, [sessions, schedule, selectedFy]);

  const openSession = sessions?.find((s) => s.status === 'OPEN');

  const isSuperAdmin = user?.role === BureauRole.SUPER_ADMIN;
  const roleLabel = user?.role ? BUREAU_ROLE_LABELS[user.role as BureauRole] ?? user.role : null;
  const initials = user?.username.slice(0, 2).toUpperCase() ?? '??';
  const avatarCls = avatarColor(initials);
  const roleBadgeCls = user?.role ? (ROLE_BADGE_COLORS[user.role as BureauRole] ?? 'bg-gray-100 text-gray-600') : '';

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm gap-3">

      {/* Zone gauche — session ouverte + sélecteur FY super admin */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Indicateur session ouverte */}
        {openSession && (
          <Link
            href={`/sessions/${openSession.id}`}
            className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Session #{openSession.sessionNumber} en cours
          </Link>
        )}

        {/* Sélecteur exercice fiscal — super admin uniquement */}
        {isSuperAdmin && fiscalYears && fiscalYears.length > 0 && (
          <select
            value={selectedFyId}
            onChange={(e) => setSelectedFyId(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-[180px] truncate"
            aria-label="Sélectionner l'exercice fiscal"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.label} {fy.status === 'ACTIVE' ? '(actif)' : fy.status === 'CASSATION' ? '(cassation)' : ''}
              </option>
            ))}
          </select>
        )}
        {/* Label exercice courant pour les non super-admins */}
        {!isSuperAdmin && selectedFy && (
          <span className="text-xs text-gray-400 hidden sm:inline truncate">
            {selectedFy.label}
          </span>
        )}
      </div>

      {/* Zone droite — notifications + user + logout */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Notification bell with dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={() => setShowNotifPanel((prev) => !prev)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5" strokeWidth={1.8} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-semibold text-gray-800">Notifications</span>
                <button
                  aria-label="Fermer"
                  onClick={() => setShowNotifPanel(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Notification list */}
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Aucune notification
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {notifications.map((notif) => {
                    const inner = (
                      <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                        <span className={`mt-0.5 ${notif.color}`}>{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                        </div>
                        <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${BADGE_STYLES[notif.badge]}`}>
                          {notif.badge === 'warning' ? 'Attention' : notif.badge === 'info' ? 'Info' : 'Urgent'}
                        </span>
                      </div>
                    );

                    return (
                      <li key={notif.id}>
                        {notif.href ? (
                          <Link href={notif.href} onClick={() => setShowNotifPanel(false)}>
                            {inner}
                          </Link>
                        ) : (
                          inner
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs shrink-0 ${avatarCls}`}>
              {initials}
            </span>
            <div className="text-left leading-none hidden sm:block">
              <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                {user.username}
              </p>
              {roleLabel && (
                <span className={`inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${roleBadgeCls}`}>
                  {roleLabel}
                </span>
              )}
            </div>
          </Link>
        )}

        <button
          onClick={logout}
          aria-label="Déconnexion"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          <span className="hidden sm:inline text-xs font-medium">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
