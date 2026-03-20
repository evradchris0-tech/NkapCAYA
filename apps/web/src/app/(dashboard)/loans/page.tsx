import PageHeader from '@components/layout/PageHeader';
import Link from 'next/link';
import Button from '@components/ui/Button';

export default function LoansPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestion des prêts"
        breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Prêts' }]}
        action={
          <Link href="/loans/new">
            <Button>+ Nouveau prêt</Button>
          </Link>
        }
      />
      <div className="bg-background border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">Liste des prêts à implémenter.</p>
      </div>
    </div>
  );
}
