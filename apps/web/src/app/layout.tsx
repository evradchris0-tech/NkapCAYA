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
