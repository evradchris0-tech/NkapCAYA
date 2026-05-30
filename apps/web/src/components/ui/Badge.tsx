import { clsx } from 'clsx';
import { type LucideIcon } from 'lucide-react';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent'
  | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  /** Affiche un point coloré pulsant à gauche du label (statut "vivant") */
  dot?: boolean;
  /** Icône Lucide à gauche du label */
  icon?: LucideIcon;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  info: 'bg-primary-50 text-primary-700 ring-1 ring-primary-100',
  accent: 'bg-accent-50 text-accent-700 ring-1 ring-accent-100',
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-primary-600',
  accent: 'bg-accent-500',
  neutral: 'bg-slate-400',
};

export default function Badge({
  label,
  variant = 'neutral',
  className,
  dot = false,
  icon: Icon,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotColors[variant],
            (variant === 'success' || variant === 'warning') && 'animate-pulse-slow',
          )}
        />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}
