import ProgressBar from '@components/ui/ProgressBar';

export default function MemberDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-36 bg-slate-200 rounded" />
          <div className="h-7 w-48 bg-slate-300 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-slate-100 rounded-lg" />
          <div className="h-9 w-24 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-6 bg-slate-300 rounded w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Fiche identité + cotisations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-28 bg-slate-100 rounded shrink-0" />
              <div className="h-4 flex-1 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="h-5 w-40 bg-slate-200 rounded" />
          <div className="h-48 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Section prêts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-11 bg-slate-50 border-b border-slate-200 px-6 flex items-center">
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-slate-100 last:border-0">
            <div className="flex-1 h-4 bg-slate-200 rounded w-32" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
