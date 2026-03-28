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
    <div className={clsx('rounded-xl border border-indigo-100/60 shadow-card overflow-hidden', className)} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)' }}>
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-sm font-semibold text-indigo-900">{title}</p>
          {subtitle && <p className="text-xs text-indigo-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 ml-4">{action}</div>}
      </div>
      {children}
    </div>
  );
}
