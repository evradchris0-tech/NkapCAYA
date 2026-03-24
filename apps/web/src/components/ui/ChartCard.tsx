import { type ReactNode } from 'react';
import { clsx } from 'clsx';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function ChartCard({ title, subtitle, className, children, action }: ChartCardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden', className)}>
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
      </div>
      {children}
    </div>
  );
}
