import PageHeader from '@components/layout/PageHeader';

export default function BeneficiariesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bénéficiaires"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Bénéficiaires' },
        ]}
      />
      <p className="text-gray-500 text-sm">
        Gestion des bénéficiaires à implémenter.
      </p>
    </div>
  );
}
