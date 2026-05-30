import ProgressBar from '@components/ui/ProgressBar';

export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-7 w-32 bg-slate-300 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="h-9 flex-1 bg-slate-100 rounded-lg" />
        <div className="h-9 w-40 bg-slate-100 rounded-lg" />
        <div className="h-9 w-36 bg-slate-100 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-11 bg-slate-50 border-b border-slate-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-slate-200 rounded w-40" />
              <div className="h-3 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
