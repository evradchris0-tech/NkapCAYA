'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

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
            // Données considérées fraîches 5 min — évite les refetch inutiles
            // lors des navigations inter-pages pendant une session de travail
            staleTime: 5 * 60 * 1000,
            // Maintenu en cache 20 min après la dernière utilisation
            gcTime: 20 * 60 * 1000,
            // Retry exponentiel : 1s → 2s → 4s (max 3 tentatives)
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
            // Pas de refetch au focus de fenêtre (app de gestion, pas temps réel)
            refetchOnWindowFocus: false,
            // Refetch dès que la connexion revient après une coupure réseau
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <html lang="fr">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '10px',
                fontSize: '14px',
                padding: '12px 16px',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.25)',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
            }}
          />
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
