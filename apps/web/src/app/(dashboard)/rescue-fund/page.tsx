import PageHeader from '@components/layout/PageHeader';

export default function RescueFundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Caisse de secours"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Caisse de secours' },
        ]}
      />
      <p className="text-gray-500 text-sm">
        Gestion de la caisse de secours à implémenter.
      </p>
    </div>
  );
}
