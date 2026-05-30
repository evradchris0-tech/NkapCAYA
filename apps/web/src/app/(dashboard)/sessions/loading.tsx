import ProgressBar from '@components/ui/ProgressBar';

export default function SessionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-7 w-36 bg-slate-300 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-lg" />
      </div>

      {/* Sélecteur exercice */}
      <div className="h-10 w-64 bg-slate-100 rounded-lg" />

      {/* Table sessions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="h-11 bg-slate-50 border-b border-slate-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-slate-100 last:border-0">
            <div className="h-4 w-6 bg-slate-100 rounded" />
            <div className="h-4 w-28 bg-slate-200 rounded flex-1" />
            <div className="h-4 w-24 bg-slate-100 rounded" />
            <div className="h-5 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
