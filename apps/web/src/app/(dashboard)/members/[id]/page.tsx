import PageHeader from '@components/layout/PageHeader';

interface MemberDetailPageProps {
  params: { id: string };
}

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Fiche membre #${params.id}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: `#${params.id}` },
        ]}
      />
      <p className="text-gray-500 text-sm">
        Détail du membre {params.id} à implémenter.
      </p>
    </div>
  );
}
