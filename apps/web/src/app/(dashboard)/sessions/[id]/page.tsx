import PageHeader from '@components/layout/PageHeader';
import TransactionForm from '@components/forms/TransactionForm';

interface SessionDetailPageProps {
  params: { id: string };
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Session #${params.id}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Sessions', href: '/sessions' },
          { label: `#${params.id}` },
        ]}
      />
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Saisie des transactions
        </h2>
        <TransactionForm />
      </div>
    </div>
  );
}
