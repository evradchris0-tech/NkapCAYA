'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import Logo from '@components/ui/Logo';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <Logo size="md" className="rounded-xl opacity-80" />
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center -mt-2">
        <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Une erreur inattendue s&apos;est produite
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          {error.message || 'Le contenu de cette page n\'a pas pu être chargé.'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">Code : {error.digest}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Home className="h-4 w-4" />
          Accueil
        </Link>
      </div>
    </div>
  );
}
