// Même géométrie que la page réelle : rail en haut, H1 au même endroit.
export default function Loading() {
  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="border-b border-line pb-4">
        <p className="text-label text-paper/40">Drops</p>
      </div>
      <h1 className="mt-16 font-editorial text-heading-lg leading-[1.05] text-paper md:mt-20 md:text-[4rem]">
        Les sorties
      </h1>
      <div className="mt-14 flex flex-col border-t border-line">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 border-b border-line" />
        ))}
      </div>
    </div>
  );
}
