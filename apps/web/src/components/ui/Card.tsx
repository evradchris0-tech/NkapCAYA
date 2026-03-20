import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-background rounded-lg border border-border shadow-soft hover:shadow-md transition-shadow duration-200',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
