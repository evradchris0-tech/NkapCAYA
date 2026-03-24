'use client';

import PageHeader from '@components/layout/PageHeader';
import MemberForm from '@components/forms/MemberForm';
import { useMember } from '@lib/hooks/useMembers';

interface MemberEditPageProps {
  params: { id: string };
}

export default function MemberEditPage({ params }: MemberEditPageProps) {
  const { data: member, isLoading, isError } = useMember(params.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Chargement…
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">
        Membre introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifier — ${member.lastName} ${member.firstName}`}
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Membres', href: '/members' },
          { label: member.memberCode, href: `/members/${member.id}` },
          { label: 'Modifier' },
        ]}
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <MemberForm
          memberId={member.id}
          defaultValues={{
            firstName: member.firstName,
            lastName: member.lastName,
            phone1: member.phone1,
            phone2: member.phone2 ?? '',
            neighborhood: member.neighborhood,
            locationDetail: member.locationDetail ?? '',
            mobileMoneyType: member.mobileMoneyType ?? '',
            mobileMoneyNumber: member.mobileMoneyNumber ?? '',
          }}
        />
      </div>
    </div>
  );
}
