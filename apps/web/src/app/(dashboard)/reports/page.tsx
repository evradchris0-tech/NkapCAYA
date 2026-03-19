import PageHeader from '@components/layout/PageHeader';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports et exports"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Rapports' }]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Export Excel</h3>
          <p className="text-gray-500 text-sm">Export des données en .xlsx</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Export PDF</h3>
          <p className="text-gray-500 text-sm">Génération de rapports PDF</p>
        </div>
      </div>
    </div>
  );
}
