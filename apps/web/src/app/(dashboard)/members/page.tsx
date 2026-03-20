import PageHeader from '@components/layout/PageHeader';
import Link from 'next/link';
import Button from '@components/ui/Button';

export default function MembersPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Membres"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Membres' }]}
        action={
          <Link href="/members/new">
            <Button>+ Nouveau membre</Button>
          </Link>
        }
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">Liste des membres à implémenter.</p>
      </div>
    </div>
  );
}
