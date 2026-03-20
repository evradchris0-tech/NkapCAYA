'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/', icon: '▦' },
  { label: 'Membres', href: '/members', icon: '👥' },
  { label: 'Sessions', href: '/sessions', icon: '📅' },
  { label: 'Épargne', href: '/savings', icon: '💰' },
  { label: 'Prêts', href: '/loans', icon: '🏦' },
  { label: 'Caisse de secours', href: '/rescue-fund', icon: '🛡️' },
  { label: 'Bénéficiaires', href: '/beneficiaries', icon: '🎁' },
  { label: 'Rapports', href: '/reports', icon: '📊' },
  { label: 'Configuration', href: '/config', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-primary text-white flex flex-col h-full border-r border-border">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-primary-dark">
        <h1 className="text-2xl font-bold tracking-tight text-white">CAYA</h1>
        <p className="text-xs text-blue-100 mt-1.5 font-medium">Gestion tontine</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-primary-dark text-xs text-blue-100 font-medium">
        v0.1.0
      </div>
    </aside>
  );
}
