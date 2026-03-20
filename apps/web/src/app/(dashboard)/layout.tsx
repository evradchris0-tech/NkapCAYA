import Sidebar from '@components/layout/Sidebar';
import Header from '@components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-secondary overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 md:p-10">{children}</main>
      </div>
    </div>
  );
}
