'use client';

import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
import { useCurrentUser, useLogout } from '@lib/hooks/useCurrentUser';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';

/** Détermine une couleur de fond cohérente pour l'avatar selon les initiales */
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
  [BureauRole.SUPER_ADMIN]:          'bg-violet-100 text-violet-700',
  [BureauRole.PRESIDENT]:            'bg-blue-100 text-blue-700',
  [BureauRole.VICE_PRESIDENT]:       'bg-blue-100 text-blue-600',
  [BureauRole.TRESORIER]:            'bg-emerald-100 text-emerald-700',
  [BureauRole.SECRETAIRE_GENERAL]:   'bg-amber-100 text-amber-700',
  [BureauRole.SECRETAIRE_ADJOINT]:   'bg-amber-100 text-amber-600',
  [BureauRole.COMMISSAIRE_AUX_COMPTES]: 'bg-gray-100 text-gray-700',
  [BureauRole.MEMBRE]:               'bg-gray-100 text-gray-500',
};

export default function Header() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const roleLabel = user?.role
    ? BUREAU_ROLE_LABELS[user.role as BureauRole] ?? user.role
    : null;

  const initials = user?.username.slice(0, 2).toUpperCase() ?? '??';
  const avatarCls = avatarColor(initials);
  const roleBadgeCls =
    user?.role ? (ROLE_BADGE_COLORS[user.role as BureauRole] ?? 'bg-gray-100 text-gray-600') : '';

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Espace gauche (breadcrumbs futurs ou titre de page) */}
      <div />

      <div className="flex items-center gap-3">
        {/* Cloche notifications (placeholder) */}
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Bell className="h-5 w-5" strokeWidth={1.8} />
        </button>

        {/* Séparateur */}
        <div className="h-6 w-px bg-gray-200" />

        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs shrink-0 ${avatarCls}`}
            >
              {initials}
            </span>
            <div className="text-left leading-none">
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
