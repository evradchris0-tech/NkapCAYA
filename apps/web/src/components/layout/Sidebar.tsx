'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardList,
  PiggyBank,
  Banknote,
  Shield,
  Gift,
  BarChart3,
  Settings,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord',    href: '/',              icon: LayoutDashboard },
  { label: 'Exercices fiscaux',  href: '/fiscal-year',   icon: Calendar },
  { label: 'Membres',            href: '/members',       icon: Users },
  { label: 'Sessions',           href: '/sessions',      icon: ClipboardList },
  { label: 'Épargne',            href: '/savings',       icon: PiggyBank },
  { label: 'Prêts',              href: '/loans',         icon: Banknote },
  { label: 'Caisse de secours',  href: '/rescue-fund',   icon: Shield },
  { label: 'Bénéficiaires',      href: '/beneficiaries', icon: Gift },
  { label: 'Rapports',           href: '/reports',       icon: BarChart3 },
  { label: 'Configuration',      href: '/config',        icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const roleLabel = user?.role
    ? BUREAU_ROLE_LABELS[user.role as BureauRole] ?? user.role
    : null;

  return (
    <aside className="w-64 shrink-0 bg-gray-900 text-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-tight text-white">
          CAYA
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Gestion tontine</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 font-medium border-l-2 border-blue-400 pl-[10px]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-gray-800">
          <Link
            href="/profile"
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
              pathname === '/profile'
                ? 'bg-blue-600/15 text-blue-400 font-medium border-l-2 border-blue-400 pl-[10px]'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
            )}
          >
            <UserCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={pathname === '/profile' ? 2.2 : 1.8} />
            Mon profil
          </Link>
        </div>
      </nav>

      {/* Footer — utilisateur connecté */}
      <div className="px-4 py-3 border-t border-gray-800">
        {user ? (
          <Link href="/profile" className="flex items-center gap-3 group">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/20 text-blue-300 font-semibold text-xs shrink-0 ring-1 ring-blue-500/30 group-hover:ring-blue-400/60 transition-all">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{roleLabel}</p>
            </div>
          </Link>
        ) : (
          <p className="text-xs text-gray-600">v0.1.0</p>
        )}
      </div>
    </aside>
  );
}
