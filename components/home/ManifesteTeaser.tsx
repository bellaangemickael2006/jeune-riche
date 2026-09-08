import Link from "next/link";

// 03 — LE MANIFESTE.
//
// Le Spotlight (dégradé radial suivant le curseur), le bouton magnétique et le
// badge en filigrane à 4% d'opacité ont été retirés : un dégradé est interdit,
// le filigrane n'était pas lisible — donc pas une information, juste du bruit —
// et l'écran cumulait trois effets pour une seule phrase.
//
// La composition n'est plus centrée : le bloc est décalé vers la droite,
// exactement là où le hero et la gamme laissaient le vide. L'axe se déplace,
// c'est ce déplacement qui fait respirer la page.
export default function ManifesteTeaser() {
  return (
    <section className="px-5 pb-32 md:px-10 md:pb-48">
      <div className="reveal flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-label text-paper/40">03 — Le manifeste</p>
      </div>

      <div className="md:grid md:grid-cols-12">
        <div className="reveal reveal-1 mt-16 md:col-span-7 md:col-start-6 md:mt-28">
          <p className="font-editorial text-heading leading-[1.25] text-paper md:text-[2.75rem] md:leading-[1.2]">
            Une couronne gravée, un visage tribal — le luxe qui ne s&apos;excuse pas d&apos;où il
            vient.
          </p>
          <Link
            href="/manifeste"
            className="mt-10 inline-block border-b border-line pb-1 text-label text-paper/60 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper md:mt-14"
          >
            Lire le manifeste
          </Link>
        </div>
      </div>
    </section>
  );
}
