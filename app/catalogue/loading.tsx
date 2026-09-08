// Même géométrie que la grille réelle du catalogue : cadres en 5/4, une
// colonne sous 640px, jusqu'à quatre en xl. Un squelette qui ne correspond pas
// à la page fait sauter le contenu au moment où il arrive.
export default function Loading() {
  return (
    <div className="mx-auto min-h-screen max-w-[1600px] bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-label text-paper/40">Catalogue</p>
          <h1 className="mt-3 font-editorial text-heading-lg text-paper md:text-[4.5rem] md:leading-[0.98]">
            Toute la collection
          </h1>
        </div>
      </div>
      <div className="mb-12 border-t border-line pt-4">
        <div className="h-3 w-20 bg-line/25" />
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 md:gap-y-20 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[5/4] bg-line/25" />
            <div className="mt-4 border-t border-line pt-3">
              <div className="h-2.5 w-16 bg-line/20" />
              <div className="mt-3 h-3.5 w-3/5 bg-line/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
