import ProgressBar from '@components/ui/ProgressBar';

export default function MemberDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-36 bg-gray-200 rounded" />
          <div className="h-7 w-48 bg-gray-300 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-100 rounded-lg" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-300 rounded w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Fiche identité + cotisations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-28 bg-gray-100 rounded shrink-0" />
              <div className="h-4 flex-1 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <div className="h-5 w-40 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Section prêts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-11 bg-gray-50 border-b border-gray-200 px-6 flex items-center">
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 last:border-0">
            <div className="flex-1 h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
