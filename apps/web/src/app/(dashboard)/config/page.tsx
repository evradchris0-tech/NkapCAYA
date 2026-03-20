import PageHeader from '@components/layout/PageHeader';

export default function ConfigPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuration CAYA"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Configuration' },
        ]}
      />
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-sm text-yellow-800 font-medium">
        ⚠️ Accès réservé aux administrateurs (SUPER_ADMIN).
      </div>
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Paramètres de configuration à implémenter.
        </p>
      </div>
    </div>
  );
}
