import ProgressBar from '@components/ui/ProgressBar';

export default function FiscalYearDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader + badge */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-40 bg-gray-200 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 bg-gray-300 rounded-lg" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-100 rounded-lg" />
          <div className="h-9 w-28 bg-blue-100 rounded-lg" />
        </div>
      </div>

      {/* Fiche infos + graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="h-5 w-28 bg-gray-200 rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-28 bg-gray-100 rounded shrink-0" />
              <div className="h-4 flex-1 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 grid grid-rows-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
            <div className="h-32 bg-gray-100 rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-5 w-36 bg-gray-200 rounded mb-4" />
            <div className="h-32 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Table membres */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-11 bg-gray-50 border-b border-gray-200 px-6 flex items-center gap-3">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-7 w-28 bg-gray-100 rounded-lg ml-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 last:border-0">
            <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 h-4 bg-gray-200 rounded w-36" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
