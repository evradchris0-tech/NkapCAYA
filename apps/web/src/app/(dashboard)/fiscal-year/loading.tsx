import ProgressBar from '@components/ui/ProgressBar';

export default function FiscalYearLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-40 bg-gray-300 rounded-lg" />
        </div>
        <div className="h-9 w-40 bg-gray-200 rounded-lg" />
      </div>

      {/* Cartes exercices */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-6 w-40 bg-gray-300 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="h-9 w-24 bg-gray-100 rounded-lg" />
            <div className="h-9 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
