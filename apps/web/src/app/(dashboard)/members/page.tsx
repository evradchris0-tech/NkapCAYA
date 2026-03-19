import PageHeader from '@components/layout/PageHeader';
import Link from 'next/link';

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Membres"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Membres' }]}
        action={
          <Link
            href="/members/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Nouveau membre
          </Link>
        }
      />
      <p className="text-gray-500 text-sm">Liste des membres à implémenter.</p>
    </div>
  );
}
