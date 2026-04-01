import { ReactNode } from 'react';
import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
}

export default function PageHeader({
  title,
  breadcrumbs,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-indigo-100/60">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #6366f1 0%, #3b82f6 100%)' }} />
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-indigo-400/70 mb-0.5">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <span className="text-indigo-200">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-indigo-600 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-indigo-500/80">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #1d4ed8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {title}
          </h1>
        </div>
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
