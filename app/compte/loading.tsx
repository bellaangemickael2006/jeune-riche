// Même géométrie que la page réelle : rail en haut, axe à gauche, mesure
// étroite. Plus de bloc centré au milieu de l'écran.
export default function Loading() {
  return (
    <div className="min-h-screen bg-ink px-5 pb-32 pt-32 md:px-10 md:pt-40">
      <div className="border-b border-line pb-4">
        <p className="text-label text-paper/40">Compte</p>
      </div>
      <div className="max-w-sm pt-16 md:pt-20">
        <div className="h-10 w-2/3 bg-line/25" />
        <div className="mt-6 h-3 w-full bg-line/20" />
        <div className="mt-10 h-12 w-full bg-line/20" />
        <div className="mt-4 h-12 w-full bg-line/20" />
      </div>
    </div>
  );
}
