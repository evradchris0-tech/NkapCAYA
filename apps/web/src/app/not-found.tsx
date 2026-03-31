import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5ff 40%, #f5f0ff 100%)' }}>
      <div className="w-20 h-20 rounded-2xl bg-white shadow-card flex items-center justify-center">
        <FileQuestion className="h-10 w-10 text-blue-500" strokeWidth={1.5} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-500 uppercase tracking-wider">Erreur 404</p>
        <h1 className="text-3xl font-bold text-gray-900">Page introuvable</h1>
        <p className="text-gray-500 max-w-sm text-sm">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        <Home className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
