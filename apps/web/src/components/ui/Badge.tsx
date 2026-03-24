import { clsx } from 'clsx';
import { type LucideIcon } from 'lucide-react';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
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
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger:  'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-gray-400',
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
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotColors[variant],
            // Pulsation douce uniquement pour success et warning (statuts actifs)
            (variant === 'success' || variant === 'warning') && 'animate-pulse-slow'
          )}
        />
      )}
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}
