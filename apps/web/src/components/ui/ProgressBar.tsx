/** Barre de progression indéterminée affichée en haut de chaque loading.tsx */
export default function ProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 overflow-hidden bg-blue-100">
      <div className="h-full w-2/5 bg-blue-500 rounded-full animate-nav-progress" />
    </div>
  );
}
