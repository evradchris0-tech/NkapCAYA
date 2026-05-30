import ProgressBar from '@components/ui/ProgressBar';

export default function FiscalYearDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader + badge */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-40 bg-slate-200 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 bg-slate-300 rounded-lg" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-slate-100 rounded-lg" />
          <div className="h-9 w-28 bg-primary-100 rounded-lg" />
        </div>
      </div>

      {/* Fiche infos + graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-28 bg-slate-200 rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-28 bg-slate-100 rounded shrink-0" />
              <div className="h-4 flex-1 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 grid grid-rows-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
            <div className="h-32 bg-slate-100 rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
            <div className="h-32 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Table membres */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-11 bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-3">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-7 w-28 bg-slate-100 rounded-lg ml-auto" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-slate-100 last:border-0">
            <div className="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 h-4 bg-slate-200 rounded w-36" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
