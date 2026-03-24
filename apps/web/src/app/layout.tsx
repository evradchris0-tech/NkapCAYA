'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

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
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
        mutationCache: new MutationCache({
          onSuccess: (_data, _variables, _context, mutation) => {
            const successMsg = (mutation.meta as any)?.successMessage;
            // Si pas de méta caché, on affiche un message par défaut pour chaque mutation
            if (successMsg !== false) {
              toast.success(successMsg || 'Opération réussie', { id: 'global-success' });
            }
          },
          onError: (error: any, _variables, _context, mutation) => {
            const customErrorMsg = (mutation.meta as any)?.errorMessage;
            const apiMessage = error.response?.data?.message || error.response?.data?.error || error.message;
            toast.error(customErrorMsg || `Erreur: ${apiMessage || 'Une erreur est survenue'}`, { id: 'global-error' });
          },
        }),
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
