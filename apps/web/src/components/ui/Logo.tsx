import Image from 'next/image';
import { clsx } from 'clsx';

const SIZES = {
  xs:  24,
  sm:  36,
  md:  56,
  lg:  80,
  xl:  120,
  '2xl': 160,
} as const;

interface LogoProps {
  size?: keyof typeof SIZES;
  className?: string;
  /** Ajoute un fond blanc arrondi — utile sur fond sombre */
  onDark?: boolean;
}

export default function Logo({ size = 'md', className, onDark = false }: LogoProps) {
  const px = SIZES[size];
  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center shrink-0',
        onDark && 'bg-white/10 rounded-xl ring-1 ring-white/20 p-1',
        className,
      )}
      style={{ width: px + (onDark ? 10 : 0), height: px + (onDark ? 10 : 0) }}
    >
      <Image
        src="/caya_logo.png"
        alt="Logo CAYA"
        width={px}
        height={px}
        priority
      />
    </span>
  );
}
