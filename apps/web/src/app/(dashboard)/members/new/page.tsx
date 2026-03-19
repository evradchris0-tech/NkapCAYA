import PageHeader from '@components/layout/PageHeader';
import MemberForm from '@components/forms/MemberForm';

export default function NewMemberPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau membre"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: 'Nouveau' },
        ]}
      />
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <MemberForm />
      </div>
    </div>
  );
}
