import Sidebar from '@components/layout/Sidebar';
import Header from '@components/layout/Header';
import ReadOnlyBanner from '@components/layout/ReadOnlyBanner';
import { FiscalYearProvider } from '@lib/context/FiscalYearContext';
import AuthGuard from '@components/auth/AuthGuard';
import { ErrorBoundary } from '@components/ui/ErrorBoundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <FiscalYearProvider>
        <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f5ff 40%, #f5f0ff 100%)' }}>
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <ReadOnlyBanner />
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-6 pb-2">
              <div className="max-w-7xl mx-auto w-full">
                <ErrorBoundary message="Une erreur inattendue s'est produite sur cette page. Cliquez sur Réessayer ou naviguez vers une autre section.">
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </div>
      </FiscalYearProvider>
    </AuthGuard>
  );
}
