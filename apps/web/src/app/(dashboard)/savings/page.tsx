import PageHeader from '@components/layout/PageHeader';

export default function SavingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Épargne et intérêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Épargne' }]}
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Suivi de l&apos;épargne et des intérêts à implémenter.
        </p>
      </div>
    </div>
  );
}
