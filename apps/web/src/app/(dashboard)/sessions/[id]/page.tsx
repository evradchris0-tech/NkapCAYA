import PageHeader from '@components/layout/PageHeader';
import TransactionForm from '@components/forms/TransactionForm';
import Card from '@components/ui/Card';

interface SessionDetailPageProps {
  params: { id: string };
}

export default function SessionDetailPage({ params }: SessionDetailPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Session #${params.id}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Sessions', href: '/sessions' },
          { label: `#${params.id}` },
        ]}
      />
      <Card padding="lg" className="max-w-2xl">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Saisie des transactions
        </h2>
        <TransactionForm />
      </Card>
    </div>
  );
}
