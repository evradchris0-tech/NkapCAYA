import PageHeader from '@components/layout/PageHeader';
import Card from '@components/ui/Card';

const kpis = [
  { label: 'Membres actifs', value: '—' },
  { label: 'Épargne totale', value: '—' },
  { label: 'Prêts en cours', value: '—' },
  { label: 'Caisse de secours', value: '—' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        breadcrumbs={[{ label: 'Accueil' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
