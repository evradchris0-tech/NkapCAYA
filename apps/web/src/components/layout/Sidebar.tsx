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
    <aside className="w-64 shrink-0 bg-gray-900 text-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wide text-white">CAYA</h1>
        <p className="text-xs text-gray-400 mt-0.5">Gestion tontine</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
        v0.1.0
      </div>
    </aside>
  );
}
