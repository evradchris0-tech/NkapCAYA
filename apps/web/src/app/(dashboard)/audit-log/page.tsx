'use client';

import { useState } from 'react';
import PageHeader from '@components/layout/PageHeader';
import { useAuditLogs } from '@lib/hooks/useAudit';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { BureauRole } from '@/types/domain.types';
import type { AuditLogDto } from '@lib/api/audit.api';
import Button from '@components/ui/Button';
import { ShieldAlert, Download, Search } from 'lucide-react';

export default function AuditLogPage() {
  const { data: currentUser } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useAuditLogs({ page, limit: 20, entityType: entityType || undefined });

  // Sécurité: seulement pour SUPER_ADMIN, PRESIDENT, SECRETAIRE_GENERAL
  const canAccess =
    currentUser?.role === BureauRole.SUPER_ADMIN ||
    currentUser?.role === BureauRole.PRESIDENT ||
    currentUser?.role === BureauRole.SECRETAIRE_GENERAL;

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-500 max-w-md">
          Cette page est réservée aux administrateurs. Vous n'avez pas les droits nécessaires
          pour consulter le journal d'audit.
        </p>
      </div>
    );
  }

  const exportToExcel = () => {
    if (!data?.data?.length) return;
    const wsData = data.data.map((log: AuditLogDto) => ({
      'Date Heure': new Date(log.createdAt).toLocaleString('fr-FR'),
      'Utilisateur': log.actor?.username || log.actorId,
      'Rôle': log.actor?.role || 'Inconnu',
      'Action': log.action,
      'Type Entité': log.entityType,
      'ID Entité': log.entityId,
      'Raison': log.reason || '',
      'Adresse IP': log.ipAddress || '',
    }));
    
    // Génération du CSV
    const headers = Object.keys(wsData[0]);
    const csvContent = [
      headers.join(';'), // En-têtes
      ...wsData.map(row => 
        Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')
      )
    ].join('\n');

    // Ajout du BOM pour l'encodage UTF-8 (compatible Excel)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `nkapcaya_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'Audit"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Audit Log' }]}
        action={
          <Button variant="secondary" onClick={exportToExcel} disabled={!data?.data?.length}>
            <Download className="h-4 w-4 mr-2" /> Exporter Excel
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-xl shadow-card border border-gray-100 flex items-center gap-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filtrer par type d'entité (ex: FiscalYear, Session)..."
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Date & Heure</th>
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entité</th>
                <th className="px-4 py-3 font-medium">Raison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Chargement des logs...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Aucun journal d'audit trouvé.
                  </td>
                </tr>
              ) : (
                data?.data?.map((log: AuditLogDto) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 tabular-nums">
                      {new Date(log.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{log.actor?.username || log.actorId}</div>
                      <div className="text-xs text-gray-500">{log.actor?.role}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{log.entityType}</div>
                      <div className="text-xs text-gray-400 font-mono" title={log.entityId}>
                        {log.entityId.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs" title={log.reason || ''}>
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} sur {data.totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
