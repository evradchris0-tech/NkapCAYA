import PageHeader from '@components/layout/PageHeader';

export default function BeneficiariesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Bénéficiaires"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Bénéficiaires' },
        ]}
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Gestion des bénéficiaires à implémenter.
        </p>
      </div>
    </div>
  );
}
