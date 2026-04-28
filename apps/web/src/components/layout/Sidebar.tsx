'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Calendar, Users, ClipboardList, PiggyBank, Banknote,
  Shield, Gift, BarChart3, Settings, UserCircle, Activity, BookOpen,
  ChevronDown, FileDown, X as CloseIcon, type LucideIcon,
} from 'lucide-react';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { useMobileNav } from '@lib/context/MobileNavContext';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';
import Logo from '@components/ui/Logo';

interface NavChild { label: string; href: string }
interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord',   href: '/',              icon: LayoutDashboard },
  { label: 'Exercices fiscaux', href: '/fiscal-year',   icon: Calendar },
  { label: 'Membres',           href: '/members',       icon: Users },
  { label: 'Sessions',          href: '/sessions',      icon: ClipboardList },
  { label: 'Épargne',           href: '/savings',       icon: PiggyBank },
  { label: 'Prêts',             href: '/loans',         icon: Banknote },
  { label: 'Caisse de secours', href: '/rescue-fund',   icon: Shield },
  { label: 'Bénéficiaires',     href: '/beneficiaries', icon: Gift },
  {
    label: 'Rapports',
    icon: FileDown,
    children: [
      { label: 'Exports',        href: '/reports' },
      { label: 'Cassation',      href: '/cassation' },
    ],
  },
  { label: 'Configuration',    href: '/config',        icon: Settings },
  { label: 'Audit',            href: '/audit',         icon: Activity },
  { label: 'Guide',            href: '/guide',         icon: BookOpen },
];

const LINK_BASE = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 border-l-2 pl-[10px]';
const LINK_ACTIVE = 'bg-blue-600/15 text-blue-400 font-medium border-blue-400';
const LINK_INACTIVE = 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { isOpen, close } = useMobileNav();
  const roleLabel = user?.role ? BUREAU_ROLE_LABELS[user.role as BureauRole] ?? user.role : null;

  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <>
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] md:hidden backdrop-blur-sm animate-fade-in"
          onClick={close}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-[70] w-64 text-gray-200 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #1e3a5f 100%)' }}
      >
        {/* Logo & Close Button (Mobile) */}
        <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" onDark />
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">CAYA</h1>
              <p className="text-[10px] text-gray-500 leading-tight">Gestion tontine</p>
            </div>
          </div>
          <button 
            onClick={close}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
              const isActuallyOpen = openGroup === item.label || isGroupActive;

              return (
                <div key={item.label}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenGroup(isActuallyOpen ? null : item.label);
                    }}
                    className={clsx(
                      LINK_BASE, 'w-full justify-between',
                      isGroupActive ? LINK_ACTIVE : LINK_INACTIVE
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isGroupActive ? 2.2 : 1.8} />
                      {item.label}
                    </span>
                    <ChevronDown
                      className={clsx('h-4 w-4 shrink-0 transition-transform duration-200', isActuallyOpen && 'rotate-180')}
                      strokeWidth={1.8}
                    />
                  </button>

                  {isActuallyOpen && (
                    <div className="ml-8 mt-0.5 space-y-0.5 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => { if(window.innerWidth < 768) close(); }}
                            className={clsx(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
                              childActive
                                ? 'text-blue-400 font-medium bg-blue-600/10'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            )}
                          >
                            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', childActive ? 'bg-blue-400' : 'bg-gray-600')} />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href!);
            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => { if(window.innerWidth < 768) close(); }}
                className={clsx(LINK_BASE, isActive ? LINK_ACTIVE : LINK_INACTIVE)}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-gray-800">
            <Link
              href="/profile"
              onClick={() => { if(window.innerWidth < 768) close(); }}
              className={clsx(LINK_BASE, pathname === '/profile' ? LINK_ACTIVE : LINK_INACTIVE)}
            >
              <UserCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={pathname === '/profile' ? 2.2 : 1.8} />
              Mon profil
            </Link>
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-gray-800">
          {user ? (
            <Link href="/profile" onClick={() => { if(window.innerWidth < 768) close(); }} className="flex items-center gap-3 group">
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
    </>
  );
}
