'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Clock, AlertCircle, Gift, Gavel, X, Lock, CalendarRange, ChevronDown, CheckCheck } from 'lucide-react';
import { useCurrentUser, useLogout } from '@lib/hooks/useCurrentUser';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';
import { useSessionsByFiscalYear } from '@lib/hooks/useSessions';
import { useBeneficiarySchedule } from '@lib/hooks/useBeneficiaries';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';

const DISMISSED_NOTIFS_KEY = 'caya_dismissed_notifs';

const FY_SECRET = 'CAYA';

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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'ACTIF',     cls: 'bg-emerald-100 text-emerald-700' },
  PENDING:   { label: 'EN ATTENTE', cls: 'bg-amber-100 text-amber-700' },
  CASSATION: { label: 'CASSATION', cls: 'bg-orange-100 text-orange-700' },
  CLOSED:    { label: 'CLÔTURÉ',   cls: 'bg-gray-100 text-gray-600' },
  ARCHIVED:  { label: 'ARCHIVÉ',   cls: 'bg-gray-100 text-gray-400' },
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

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Header() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { selectedFyId, selectedFy, setSelectedFyId, fiscalYears } = useFiscalYearContext();
  const { data: sessions } = useSessionsByFiscalYear(selectedFyId);
  const { data: schedule } = useBeneficiarySchedule(selectedFyId);

  // Today's date
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
    [],
  );

  // Dismissed notifications (persisted in localStorage)
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DISMISSED_NOTIFS_KEY) ?? '[]'); }
    catch { return []; }
  });

  const dismissNotif = useCallback((id: string) => {
    setDismissedIds((prev) => {
      const next = [...prev, id];
      localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);


  // Notification panel
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // FY custom dropdown
  const [showFyDropdown, setShowFyDropdown] = useState(false);
  const fyDropdownRef = useRef<HTMLDivElement>(null);

  // FY switch modal
  const [pendingFyId, setPendingFyId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Close notif panel on outside click
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

  // Close FY dropdown on outside click
  useEffect(() => {
    if (!showFyDropdown) return;
    function handleClick(e: MouseEvent) {
      if (fyDropdownRef.current && !fyDropdownRef.current.contains(e.target as Node)) {
        setShowFyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showFyDropdown]);

  // Focus code input when modal opens
  useEffect(() => {
    if (pendingFyId) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [pendingFyId]);

  const notifications = useMemo<Notification[]>(() => {
    const items: Notification[] = [];

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

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedIds.includes(n.id)),
    [notifications, dismissedIds],
  );

  const dismissAll = useCallback(() => {
    const allIds = [...dismissedIds, ...notifications.map((n) => n.id)];
    const unique = [...new Set(allIds)];
    setDismissedIds(unique);
    localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(unique));
  }, [dismissedIds, notifications]);

  const openSession = sessions?.find((s) => s.status === 'OPEN');
  const isSuperAdmin = user?.role === BureauRole.SUPER_ADMIN;
  // Membres du bureau (tout rôle sauf MEMBRE simple) peuvent consulter les exercices historiques
  const canSwitchFy = user?.role !== undefined && user.role !== BureauRole.MEMBRE;
  const roleLabel = user?.role ? BUREAU_ROLE_LABELS[user.role as BureauRole] ?? user.role : null;
  const initials = user?.username.slice(0, 2).toUpperCase() ?? '??';
  const avatarCls = avatarColor(initials);
  const roleBadgeCls = user?.role ? (ROLE_BADGE_COLORS[user.role as BureauRole] ?? 'bg-gray-100 text-gray-600') : '';

  // Computed FY descriptive info
  const fyStatus = selectedFy ? STATUS_LABELS[selectedFy.status] ?? { label: selectedFy.status, cls: 'bg-gray-100 text-gray-600' } : null;

  // FY selector change handler — intercept to require code
  const handleFyChange = useCallback((newId: string) => {
    setShowFyDropdown(false);
    if (newId === selectedFyId) return;
    setPendingFyId(newId);
    setCodeInput('');
    setCodeError('');
  }, [selectedFyId]);

  // Modal confirm handler
  function handleCodeConfirm() {
    if (codeInput.trim() !== FY_SECRET) {
      setCodeError('Code incorrect. Veuillez réessayer.');
      setCodeInput('');
      codeInputRef.current?.focus();
      return;
    }
    if (pendingFyId) {
      setSelectedFyId(pendingFyId);
    }
    setPendingFyId(null);
    setCodeInput('');
    setCodeError('');
  }

  function handleModalCancel() {
    setPendingFyId(null);
    setCodeInput('');
    setCodeError('');
  }

  const pendingFy = pendingFyId ? fiscalYears?.find((f) => f.id === pendingFyId) : null;

  return (
    <>
      <header className="h-14 shrink-0 border-b border-indigo-100 flex items-center justify-between px-6 shadow-sm gap-3" style={{ background: 'linear-gradient(90deg, #ffffff 0%, #f5f3ff 50%, #eff6ff 100%)' }}>

        {/* Zone gauche */}
        <div className="flex items-center gap-3 min-w-0 flex-1">

          {/* Session ouverte */}
          {openSession && (
            <Link
              href={`/sessions/${openSession.id}`}
              className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Session #{openSession.sessionNumber} en cours
            </Link>
          )}

          {/* Sélecteur exercice fiscal (membres du bureau) — dropdown custom */}
          {canSwitchFy && fiscalYears && fiscalYears.length > 0 && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative" ref={fyDropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setShowFyDropdown((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showFyDropdown}
                  className={`flex items-center gap-2 text-xs border rounded-lg pl-3 pr-2.5 py-1.5 bg-white transition-all cursor-pointer shrink-0
                    ${showFyDropdown
                      ? 'border-blue-400 ring-2 ring-blue-100 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <CalendarRange className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="font-medium max-w-[130px] truncate">
                    {selectedFy?.label ?? 'Exercice…'}
                  </span>
                  {fyStatus && (
                    <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${fyStatus.cls}`}>
                      {fyStatus.label}
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${showFyDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown list */}
                {showFyDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden py-1">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Exercices fiscaux
                    </p>
                    <ul role="listbox">
                      {fiscalYears.map((fy) => {
                        const st = STATUS_LABELS[fy.status] ?? { label: fy.status, cls: 'bg-gray-100 text-gray-600' };
                        const isSelected = fy.id === selectedFyId;
                        return (
                          <li key={fy.id} role="option" aria-selected={isSelected}>
                            <button
                              type="button"
                              onClick={() => handleFyChange(fy.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                                ${isSelected
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-transparent border border-gray-300'}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                  {fy.label}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {formatDate(fy.startDate)} – {formatDate(fy.endDate)}
                                </p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${st.cls}`}>
                                {st.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notes de l'exercice */}
              {selectedFy?.notes && (
                <span className="hidden lg:inline text-xs text-gray-400 italic truncate max-w-[180px]">
                  {selectedFy.notes}
                </span>
              )}
            </div>
          )}

          {/* Label exercice courant pour les simples membres (pas de switcher) */}
          {!canSwitchFy && selectedFy && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="text-gray-600 font-medium">{selectedFy.label}</span>
              {fyStatus && (
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${fyStatus.cls}`}>
                  {fyStatus.label}
                </span>
              )}
              <span className="text-gray-400 hidden lg:inline">
                {formatDate(selectedFy.startDate)} – {formatDate(selectedFy.endDate)}
              </span>
            </div>
          )}
        </div>

        {/* Zone droite */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Date du jour */}
          <span className="hidden md:inline-flex items-center text-xs text-gray-400 font-medium capitalize px-2 py-1 bg-gray-50 rounded-lg border border-gray-100 shrink-0">
            {todayLabel}
          </span>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              aria-label="Notifications"
              onClick={() => setShowNotifPanel((prev) => !prev)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5" strokeWidth={1.8} />
              {visibleNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                  {visibleNotifications.length > 9 ? '9+' : visibleNotifications.length}
                </span>
              )}
            </button>

            {showNotifPanel && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  <div className="flex items-center gap-1">
                    {visibleNotifications.length > 0 && (
                      <button
                        aria-label="Tout effacer"
                        onClick={dismissAll}
                        title="Tout effacer"
                        className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      aria-label="Fermer"
                      onClick={() => setShowNotifPanel(false)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {visibleNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    Aucune notification
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                    {visibleNotifications.map((notif) => {
                      const content = (
                        <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group/notif">
                          <span className={`mt-0.5 ${notif.color}`}>{notif.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${BADGE_STYLES[notif.badge]}`}>
                              {notif.badge === 'warning' ? 'Attention' : notif.badge === 'info' ? 'Info' : 'Urgent'}
                            </span>
                            <button
                              aria-label="Fermer cette notification"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissNotif(notif.id); }}
                              className="opacity-0 group-hover/notif:opacity-100 transition-opacity p-0.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                      return (
                        <li key={notif.id}>
                          {notif.href ? (
                            <Link href={notif.href} onClick={() => { setShowNotifPanel(false); dismissNotif(notif.id); }}>
                              {content}
                            </Link>
                          ) : content}
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

      {/* ── FY Switch confirmation modal ────────────────────────────── */}
      {pendingFyId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleModalCancel}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Changement d&apos;exercice</h2>
                <p className="text-xs text-gray-500 mt-0.5">Authentification requise</p>
              </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 leading-relaxed">
              Vous souhaitez passer à l&apos;exercice{' '}
              <span className="font-semibold">{pendingFy?.label ?? '...'}</span>.
              <br />
              Entrez le code d&apos;accès pour confirmer le changement.
            </div>

            {/* Code input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700">Code d&apos;accès</label>
              <input
                ref={codeInputRef}
                type="password"
                placeholder="••••••••"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCodeConfirm(); if (e.key === 'Escape') handleModalCancel(); }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent tracking-widest"
                autoComplete="off"
              />
              {codeError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {codeError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleModalCancel}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCodeConfirm}
                disabled={!codeInput}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Changer d&apos;exercice
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
