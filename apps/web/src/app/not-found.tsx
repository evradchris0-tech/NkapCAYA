import Link from 'next/link';
import { Home } from 'lucide-react';
import Logo from '@components/ui/Logo';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4"
      style={{ background: 'linear-gradient(135deg, #f0f4fa 0%, #eef1f5 40%, #f0f4fa 100%)' }}>
      <Logo size="xl" className="rounded-2xl shadow-lg" />

      <div className="space-y-2">
        <p className="text-sm font-medium text-primary-500 uppercase tracking-wider">Erreur 404</p>
        <h1 className="text-3xl font-bold text-slate-900">Page introuvable</h1>
        <p className="text-slate-500 max-w-sm text-sm">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        <Home className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
