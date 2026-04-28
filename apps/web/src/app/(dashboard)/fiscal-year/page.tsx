'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@components/layout/PageHeader';
import Button from '@components/ui/Button';
import ConfirmDialog from '@components/ui/ConfirmDialog';
import { useFiscalYears, useDeleteFiscalYear } from '@lib/hooks/useFiscalYear';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { FiscalYear, FiscalYearStatus } from '@/types/api.types';

const STATUS_LABELS: Record<FiscalYearStatus, string> = {
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  CASSATION: 'Cassation',
  CLOSED: 'Clôturé',
  ARCHIVED: 'Archivé',
};

const STATUS_COLORS: Record<FiscalYearStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  CASSATION: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-gray-100 text-gray-400',
};

export default function FiscalYearListPage() {
  const { data: fiscalYears, isLoading } = useFiscalYears();
  const { data: currentUser } = useCurrentUser();
  const deleteFy = useDeleteFiscalYear();
  const isSuperAdmin = currentUser?.role === BureauRole.SUPER_ADMIN;

  const [toDelete, setToDelete] = useState<FiscalYear | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    await deleteFy.mutateAsync(toDelete.id);
    setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercices fiscaux"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Exercices fiscaux' }]}
        action={
          isSuperAdmin && (
            <Link href="/fiscal-year/new">
              <Button size="sm">+ Nouvel exercice</Button>
            </Link>
          )
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
          Chargement…
        </div>
      ) : !fiscalYears || fiscalYears.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Aucun exercice fiscal créé.</p>
          {isSuperAdmin && (
            <Link href="/fiscal-year/new">
              <Button>Créer le premier exercice</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Exercice</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Période</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Cassation</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-600">Statut</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fiscalYears.map((fy) => (
                  <tr key={fy.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{fy.label}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(fy.startDate).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(fy.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(fy.cassationDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[fy.status]}`}
                      >
                        {STATUS_LABELS[fy.status]}
                      </span>
                      {fy.isImported && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 ml-1.5">
                          Importé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin && fy.status === 'PENDING' && (
                          <>
                            <Link href={`/fiscal-year/${fy.id}`}>
                              <Button size="sm" variant="secondary">Modifier</Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setToDelete(fy)}
                            >
                              Supprimer
                            </Button>
                          </>
                        )}
                        <Link
                          href={`/fiscal-year/${fy.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          Voir →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(toDelete)}
        title="Supprimer cet exercice"
        message={`Voulez-vous vraiment supprimer l'exercice "${toDelete?.label}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteFy.isPending}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
