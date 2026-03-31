import ProgressBar from '@components/ui/ProgressBar';

export default function BeneficiariesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <ProgressBar />

      {/* PageHeader */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-7 w-44 bg-gray-300 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>

      {/* Sélecteur exercice + infos */}
      <div className="flex gap-3">
        <div className="h-10 w-56 bg-gray-100 rounded-lg" />
        <div className="h-10 w-32 bg-gray-100 rounded-lg" />
      </div>

      {/* Grille de slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
