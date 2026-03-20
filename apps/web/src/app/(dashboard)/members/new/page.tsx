import PageHeader from '@components/layout/PageHeader';
import MemberForm from '@components/forms/MemberForm';
import Card from '@components/ui/Card';

export default function NewMemberPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Nouveau membre"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: 'Nouveau' },
        ]}
      />
      <Card padding="lg" className="max-w-2xl">
        <MemberForm />
      </Card>
    </div>
  );
}
