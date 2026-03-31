import ProgressBar from '@components/ui/ProgressBar';

export default function LoansLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-24 bg-gray-300 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Filtres membre */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
        <div className="h-9 w-52 bg-gray-100 rounded-lg" />
        <div className="h-9 w-40 bg-gray-100 rounded-lg" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg ml-auto" />
      </div>

      {/* Table prêts */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-11 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
            <div className="flex-1 h-4 bg-gray-200 rounded w-36" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-5 w-24 bg-gray-100 rounded-full" />
            <div className="h-8 w-20 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
