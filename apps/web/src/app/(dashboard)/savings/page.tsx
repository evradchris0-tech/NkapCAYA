import PageHeader from '@components/layout/PageHeader';

export default function SavingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Épargne et intérêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Épargne' }]}
      />
      <p className="text-gray-500 text-sm">
        Suivi de l&apos;épargne et des intérêts à implémenter.
      </p>
    </div>
  );
}
