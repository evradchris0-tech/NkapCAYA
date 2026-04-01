import { clsx } from 'clsx';

/** Barre animée générique — utiliser className pour dimensions */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-gray-200 rounded-md',
        className
      )}
    />
  );
}

/** Ligne de table skeleton (N colonnes) */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  const widths = [70, 50, 60, 40, 55, 45, 65, 50];
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 animate-pulse bg-gray-200 rounded-md"
            style={{ width: `${widths[i % widths.length]}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

/** Card KPI skeleton pour le dashboard */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-card">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 animate-pulse bg-gray-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2 pt-0.5">
          <div className="h-3 w-24 animate-pulse bg-gray-200 rounded" />
          <div className="h-7 w-20 animate-pulse bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  );
}
