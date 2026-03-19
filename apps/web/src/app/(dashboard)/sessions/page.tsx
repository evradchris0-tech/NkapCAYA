import PageHeader from '@components/layout/PageHeader';

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions mensuelles"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Sessions' }]}
      />
      <p className="text-gray-500 text-sm">Liste des sessions à implémenter.</p>
    </div>
  );
}
