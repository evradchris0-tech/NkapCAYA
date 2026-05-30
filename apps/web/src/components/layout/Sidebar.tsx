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
  { label: 'Audit',            href: '/audit-log',     icon: Activity },
  { label: 'Guide',            href: '/guide',         icon: BookOpen },
];

const LINK_BASE = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 border-l-2 pl-[10px]';
const LINK_ACTIVE = 'bg-primary-50 text-primary-900 font-semibold border-primary-900 shadow-sm';
const LINK_INACTIVE = 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-transparent';

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

      <aside 
        className={clsx(
          "fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-slate-200 text-slate-600 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo & Close Button (Mobile) */}
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-primary-900 leading-tight font-heading">NkapZen</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-tight mt-0.5">Gestion de tontine</p>
            </div>
          </div>
          <button 
            onClick={close}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            if (item.label === 'Audit') {
              const canAccessAudit =
                user?.role === BureauRole.SUPER_ADMIN ||
                user?.role === BureauRole.PRESIDENT ||
                user?.role === BureauRole.SECRETAIRE_GENERAL;
              if (!canAccessAudit) return null;
            }

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
                                ? 'text-primary-900 font-medium bg-slate-50'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            )}
                          >
                            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', childActive ? 'bg-primary-900' : 'bg-slate-300')} />
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

          <div className="pt-2 mt-2 border-t border-slate-100">
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

        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          {user ? (
            <Link href="/profile" onClick={() => { if(window.innerWidth < 768) close(); }} className="flex items-center gap-3 group">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs shrink-0 ring-1 ring-slate-300 group-hover:bg-primary-900 group-hover:text-white transition-all">
                {user.username.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-700 transition-colors">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
              </div>
            </Link>
          ) : (
            <p className="text-xs text-slate-400 font-medium">v1.0.0</p>
          )}
        </div>
      </aside>
    </>
  );
}
