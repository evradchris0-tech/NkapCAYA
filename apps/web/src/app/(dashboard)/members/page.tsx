'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Users } from 'lucide-react';
import PageHeader from '@components/layout/PageHeader';
import Pagination from '@components/ui/Pagination';
import Badge from '@components/ui/Badge';
import EmptyState from '@components/ui/EmptyState';
import { SkeletonRow } from '@components/ui/Skeleton';
import { useMembers } from '@lib/hooks/useMembers';

const LIMIT = 20;

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, isLoading, isError } = useMembers({
    page,
    limit: LIMIT,
    search: debouncedSearch || undefined,
    role: role || undefined,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Membres"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Membres' }]}
        action={
          <Link
            href="/members/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Nouveau membre
          </Link>
        }
      />

      {/* Filtres */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-card flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher (Nom, Code, Tél…)"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          value={role || ''}
          onChange={(e) => { setRole(e.target.value || undefined); setPage(1); }}
          className="border border-gray-300 rounded-lg text-sm py-2 px-3 w-full md:w-auto focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Tous les rôles</option>
          <option value="PRESIDENT">Président</option>
          <option value="VICE_PRESIDENT">Vice-Président</option>
          <option value="SECRETAIRE_GENERAL">Secrétaire Général</option>
          <option value="SECRETAIRE_ADJOINT">Secrétaire Adjoint</option>
          <option value="TRESORIER">Trésorier</option>
          <option value="COMMISSAIRE_AUX_COMPTES">Commissaire aux comptes</option>
          <option value="CENSEUR">Censeur</option>
          <option value="MEMBRE">Simple Membre</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        {isError ? (
          <div className="flex items-center justify-center py-16 text-red-500 text-sm">
            Erreur lors du chargement des membres.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Nom complet</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Téléphone</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Quartier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide text-xs">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))
                ) : !data || data.data.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={Users}
                        title={debouncedSearch ? 'Aucun résultat' : 'Aucun membre enregistré'}
                        description={
                          debouncedSearch
                            ? `Aucun membre ne correspond à "${debouncedSearch}"`
                            : 'Commencez par inscrire le premier membre.'
                        }
                        action={
                          !debouncedSearch ? (
                            <Link
                              href="/members/new"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                            >
                              <UserPlus className="h-4 w-4" />
                              Inscrire le premier membre
                            </Link>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  data.data.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/60 transition-colors duration-100">
                      <td className="px-4 py-3 font-mono text-gray-500 text-xs">{member.memberCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {member.lastName} {member.firstName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{member.phone1}</td>
                      <td className="px-4 py-3 text-gray-600">{member.neighborhood}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={member.user.isActive ? 'success' : 'danger'}
                          label={member.user.isActive ? 'Actif' : 'Inactif'}
                          dot
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/members/${member.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
                        >
                          Voir →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {data && data.data.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100">
                <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  total={data.total}
                  limit={LIMIT}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
