import PageHeader from '@components/layout/PageHeader';
import Link from 'next/link';

export default function LoansPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des prêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Prêts' }]}
        action={
          <Link
            href="/loans/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nouveau prêt
          </Link>
        }
      />
      <p className="text-gray-500 text-sm">Liste des prêts à implémenter.</p>
    </div>
  );
}
