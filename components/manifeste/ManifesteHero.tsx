// La vidéo `manifeste-motif.mp4` a été retirée du fond de cette page, pour les
// mêmes raisons que la vidéo de l'accueil : 10,8 Mo chargés en `preload="auto"`
// avant le premier mot lisible, et un contenu qui n'est pas une photographie
// mais une mosaïque du badge répété — c'est-à-dire le crest transformé en
// papier peint. Le voile `bg-ink/50` qui la recouvrait pour rendre le titre
// lisible disparaît avec elle : quand il faut assombrir une image de moitié
// pour pouvoir lire par-dessus, l'image ne sert pas la page.
//
// Le fichier reste dans le dépôt. Il redeviendra utilisable le jour où il
// servira une séquence courte et voulue, pas un fond permanent.
export default function ManifesteHero() {
  return (
    <section className="flex min-h-[78svh] flex-col bg-ink px-5 pb-10 pt-28 md:px-10 md:pt-36">
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-label text-paper/40">Manifeste</p>
        <p className="text-label text-paper/25">Côte d&apos;Ivoire</p>
      </div>

      <div className="flex flex-1 items-end pt-24">
        <h1 className="reveal font-display text-[22vw] uppercase leading-[0.82] text-paper md:text-[13vw]">
          Manifeste
        </h1>
      </div>
    </section>
  );
}
