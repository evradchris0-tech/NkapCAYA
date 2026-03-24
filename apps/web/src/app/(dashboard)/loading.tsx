export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse p-6">
      {/* Header skeleton */}
      <div className="h-7 w-48 bg-gray-200 rounded-lg" />
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-7 bg-gray-300 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 h-64" />
        <div className="bg-white rounded-xl border border-gray-200 h-64" />
      </div>
    </div>
  );
}
