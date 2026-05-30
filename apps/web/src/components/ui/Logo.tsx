import Image from 'next/image';
import { clsx } from 'clsx';

const SIZES = {
  xs: 24,
  sm: 36,
  md: 56,
  lg: 80,
  xl: 120,
  '2xl': 160,
  '3xl': 220,
  '4xl': 280,
} as const;

interface LogoProps {
  size?: keyof typeof SIZES;
  className?: string;
  /** 'mark' = emblème seul · 'full' = emblème + mot-symbole NkapZen */
  variant?: 'mark' | 'full';
  /** Ajoute un fond clair arrondi — utile sur fond marine */
  onDark?: boolean;
}

export default function Logo({ size = 'md', variant = 'mark', className, onDark = false }: LogoProps) {
  const px = SIZES[size];

  const mark = (
    <span
      className={clsx(
        'inline-flex items-center justify-center shrink-0',
        onDark && 'bg-white/95 rounded-xl ring-1 ring-white/25 p-1',
      )}
      style={{ width: px + (onDark ? 8 : 0), height: px + (onDark ? 8 : 0) }}
    >
      <Image
        src="/nkapzen-mark.png"
        alt="NkapZen"
        width={px}
        height={px}
        priority
        unoptimized
        className="object-contain"
      />
    </span>
  );

  if (variant === 'mark') {
    return <span className={clsx('inline-flex', className)}>{mark}</span>;
  }

  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      {mark}
      <span
        className={clsx(
          'font-extrabold tracking-tight leading-none',
          onDark ? 'text-white' : 'text-primary-800',
        )}
        style={{ fontSize: Math.round(px * 0.42) }}
      >
        NkapZen
      </span>
    </span>
  );
}
