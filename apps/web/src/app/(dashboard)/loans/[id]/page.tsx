import PageHeader from '@components/layout/PageHeader';

interface LoanDetailPageProps {
  params: { id: string };
}

export default function LoanDetailPage({ params }: LoanDetailPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Prêt #${params.id}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Prêts', href: '/loans' },
          { label: `#${params.id}` },
        ]}
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Détail du prêt {params.id} à implémenter.
        </p>
      </div>
    </div>
  );
}
