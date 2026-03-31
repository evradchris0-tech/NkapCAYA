import ProgressBar from '@components/ui/ProgressBar';

export default function SessionsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-36 bg-gray-300 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Sélecteur exercice */}
      <div className="h-10 w-64 bg-gray-100 rounded-lg" />

      {/* Table sessions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-11 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-gray-100 last:border-0">
            <div className="h-4 w-6 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded flex-1" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
