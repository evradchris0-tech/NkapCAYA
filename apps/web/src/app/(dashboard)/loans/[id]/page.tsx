import PageHeader from '@components/layout/PageHeader';

interface LoanDetailPageProps {
  params: { id: string };
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Prêt #${params.id}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Prêts', href: '/loans' },
          { label: `#${params.id}` },
        ]}
      />
      <p className="text-gray-500 text-sm">
        Détail du prêt {params.id} à implémenter.
      </p>
    </div>
  );
}
