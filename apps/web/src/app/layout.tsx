'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,      // Données fraîches 2 min
            gcTime: 15 * 60 * 1000,         // Cache 15 min
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
            refetchOnWindowFocus: true,     // Resync au retour sur l'onglet
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <html lang="fr">
      <head>
        <title>NkapZen — Gestion de tontine</title>
        <meta name="description" content="NkapZen — plateforme de gestion de tontine (épargne, prêts, caisse de secours)." />
      </head>
      <body className="font-sans bg-surface-secondary text-slate-800">
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: '8px',
                fontSize: '14px',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#e11d48', secondary: '#ffffff' } },
            }}
          />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
