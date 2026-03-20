import PageHeader from '@components/layout/PageHeader';
import Card from '@components/ui/Card';

const kpis = [
  { label: 'Membres actifs', value: '—', icon: '👥' },
  { label: 'Épargne totale', value: '—', icon: '💰' },
  { label: 'Prêts en cours', value: '—', icon: '🏦' },
  { label: 'Caisse de secours', value: '—', icon: '🛡️' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        breadcrumbs={[{ label: 'Accueil' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="group hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-3xl font-bold text-foreground mt-3">{kpi.value}</p>
              </div>
              <div className="text-4xl">{kpi.icon}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
