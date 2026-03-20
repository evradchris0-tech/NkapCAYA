import PageHeader from '@components/layout/PageHeader';
import Card from '@components/ui/Card';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Rapports et exports"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Rapports' }]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg">
          <h3 className="font-semibold text-foreground mb-2">📊 Export Excel</h3>
          <p className="text-muted-foreground text-sm">Export des données en .xlsx</p>
        </Card>
        <Card className="hover:shadow-lg">
          <h3 className="font-semibold text-foreground mb-2">📄 Export PDF</h3>
          <p className="text-muted-foreground text-sm">Génération de rapports PDF</p>
        </Card>
      </div>
    </div>
  );
}
