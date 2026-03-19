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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-600 transition"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-500">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
