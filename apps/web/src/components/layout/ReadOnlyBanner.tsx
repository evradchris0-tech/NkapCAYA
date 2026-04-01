'use client';

import { EyeIcon } from 'lucide-react';
import { useFiscalYearContext } from '@lib/context/FiscalYearContext';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CASSATION: 'Cassation',
  CLOSED: 'Clôturé',
  ARCHIVED: 'Archivé',
};

export default function ReadOnlyBanner() {
  const { isReadOnly, selectedFy } = useFiscalYearContext();

  if (!isReadOnly || !selectedFy) return null;

  const statusLabel = STATUS_LABELS[selectedFy.status] ?? selectedFy.status;

  return (
    <div className="shrink-0 flex items-center gap-2.5 px-6 py-2 text-xs font-medium"
      style={{ background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)', borderBottom: '1px solid #fbbf24' }}
    >
      <EyeIcon className="h-3.5 w-3.5 text-amber-700 shrink-0" />
      <span className="text-amber-900">
        Mode consultation —{' '}
        <span className="font-semibold">{selectedFy.label}</span>
        {' '}·{' '}
        <span className="font-normal opacity-80">{statusLabel}</span>
        {' '}· Aucune modification possible sur cet exercice.
      </span>
    </div>
  );
}
