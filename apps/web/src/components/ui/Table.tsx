import { ReactNode } from 'react';
import { clsx } from 'clsx';

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
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Aucune donnée',
  isLoading = false,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background shadow-soft">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-secondary border-b border-border">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={clsx(
                  'px-6 py-4 text-left font-semibold text-foreground uppercase tracking-wide text-xs',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-muted-foreground"
              >
                Chargement…
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-secondary transition-colors duration-200"
              >
                {columns.map((col) => {
                  const rawValue = (row as Record<string, unknown>)[
                    String(col.key)
                  ];
                  return (
                    <td
                      key={String(col.key)}
                      className={clsx('px-6 py-4 text-foreground', col.className)}
                    >
                      {col.render ? col.render(rawValue, row) : String(rawValue ?? '—')}
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
