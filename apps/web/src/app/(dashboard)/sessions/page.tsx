import PageHeader from '@components/layout/PageHeader';

export default function SessionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Sessions mensuelles"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Sessions' }]}
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">Liste des sessions à implémenter.</p>
      </div>
    </div>
  );
}
