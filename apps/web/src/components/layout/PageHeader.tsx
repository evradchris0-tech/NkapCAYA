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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-primary-100/60">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full shrink-0" style={{ background: 'linear-gradient(180deg, #1d325b 0%, #1d325b 100%)' }} />
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-primary-400/70 mb-0.5">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <span className="text-primary-200">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary-600 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-primary-500/80">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-xl sm:text-2xl font-bold leading-tight" style={{ background: 'linear-gradient(90deg, #0f1c33 0%, #162848 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {title}
          </h1>
        </div>
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
