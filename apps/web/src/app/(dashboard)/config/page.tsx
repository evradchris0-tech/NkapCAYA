import PageHeader from '@components/layout/PageHeader';

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuration CAYA"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Configuration' },
        ]}
      />
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
        Accès réservé aux administrateurs (SUPER_ADMIN).
      </div>
      <p className="text-gray-500 text-sm">
        Paramètres de configuration à implémenter.
      </p>
    </div>
  );
}
