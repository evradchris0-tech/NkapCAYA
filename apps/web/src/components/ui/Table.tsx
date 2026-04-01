import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { SkeletonRow } from './Skeleton';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  isLoading?: boolean;
  /** Nombre de lignes skeleton affichées pendant le chargement */
  skeletonRows?: number;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Aucune donnée',
  isLoading = false,
  skeletonRows = 5,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-card">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50/80">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(
                  'px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wide text-xs',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <SkeletonRow key={i} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-sm text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-gray-50/60 transition-colors duration-100"
              >
                {columns.map((col) => {
                  const rawValue = (row as Record<string, unknown>)[
                    String(col.key)
                  ];
                  return (
                    <td
                      key={String(col.key)}
                      className={clsx('px-4 py-3 text-gray-700', col.className)}
                    >
                      {col.render
                        ? col.render(rawValue, row)
                        : String(rawValue ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
