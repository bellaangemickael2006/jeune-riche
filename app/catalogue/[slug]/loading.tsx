// Le squelette doit avoir exactement la géométrie de la page qu'il annonce,
// sinon le contenu « saute » à l'arrivée. Mêmes proportions que ProductViewer :
// galerie en 5/4 sur 1,4fr, panneau d'achat sur 1fr.
export default function Loading() {
  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-start md:gap-16 lg:gap-24">
        <div className="aspect-[5/4] bg-line/25" />
        <div className="flex max-w-md flex-col gap-5">
          <div className="h-3 w-24 bg-line/25" />
          <div className="h-9 w-3/4 bg-line/25" />
          <div className="h-4 w-28 bg-line/25" />
          <div className="mt-6 h-3 w-full bg-line/20" />
          <div className="h-3 w-5/6 bg-line/20" />
          <div className="mt-8 h-12 w-full bg-line/25" />
        </div>
      </div>
    </div>
  );
}
