import PageHeader from '@components/layout/PageHeader';

export default function RescueFundPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Caisse de secours"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Caisse de secours' },
        ]}
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Gestion de la caisse de secours à implémenter.
        </p>
      </div>
    </div>
  );
}
