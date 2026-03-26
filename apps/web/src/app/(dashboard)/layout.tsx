import Sidebar from '@components/layout/Sidebar';
import Header from '@components/layout/Header';
import { FiscalYearProvider } from '@lib/context/FiscalYearContext';
import AuthGuard from '@components/auth/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <FiscalYearProvider>
        <div className="flex h-screen bg-gray-100 overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </FiscalYearProvider>
    </AuthGuard>
  );
}
