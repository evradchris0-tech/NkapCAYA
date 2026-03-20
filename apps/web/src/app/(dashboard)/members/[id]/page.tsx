import PageHeader from '@components/layout/PageHeader';

interface MemberDetailPageProps {
  params: { id: string };
}

export default function MemberDetailPage({ params }: MemberDetailPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Fiche membre #${params.id}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: `#${params.id}` },
        ]}
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">
          Détail du membre {params.id} à implémenter.
        </p>
      </div>
    </div>
  );
}
