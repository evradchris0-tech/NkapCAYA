import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-2 sm:p-3',
  md: 'p-3 sm:p-5',
  lg: 'p-4 sm:p-6',
};

export default function Card({
  children,
  className,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-sm border border-gray-100',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
