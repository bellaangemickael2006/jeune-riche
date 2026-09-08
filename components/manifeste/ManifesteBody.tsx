import Image from "next/image";
import Link from "next/link";

// Expérience éditoriale en plusieurs temps plutôt qu'un bloc « titre + trois
// paragraphes » : chaque section respire seule, la composition alterne
// asymétriquement, et les seuls visuels utilisés sont des assets réels de la
// marque — aucune photographie de campagne n'existe encore, donc aucune n'est
// simulée ici.
//
// WordPullUp et les boutons magnétiques ont été retirés : le premier plaçait
// le texte hors d'un masque tant que l'animation ne partait pas (une phrase de
// manifeste qui peut ne jamais apparaître n'est pas acceptable), le second est
// un effet de démonstration. Le cadre image passe en 5/4, format réel des
// visuels produit.
export default function ManifesteBody() {
  return (
    <div className="bg-ink">
      {/* Temps 1 — affirmation, plein cadre, asymétrique à gauche */}
      <section className="border-t border-line px-5 py-28 md:px-10 md:py-40">
        <p className="text-label text-paper/35">01</p>
        <h2 className="reveal mt-10 max-w-4xl font-editorial text-heading leading-[1.15] text-paper md:text-[4rem] md:leading-[1.08]">
          Une couronne gravée sur un visage tribal.
        </h2>
      </section>

      {/* Temps 2 — texte / image, colonnes inégales */}
      <section className="grid gap-12 border-t border-line px-5 py-24 md:grid-cols-[1fr_1.2fr] md:gap-20 md:px-10 md:py-32">
        <div className="flex flex-col justify-center">
          <p className="text-label text-paper/35">02</p>
          <p className="mt-8 font-editorial text-heading leading-[1.25] text-paper">
            Le noir qui affirme, le blanc qui respire — rien d&apos;autre.
          </p>
          <p className="mt-8 max-w-sm text-body leading-relaxed text-paper/50">
            Pas de dégradé, pas de couleur de studio confondue avec une couleur de marque. Une
            palette resserrée, tenue.
          </p>
        </div>
        <div className="relative aspect-[5/4] overflow-hidden bg-studio">
          <Image
            src="/images/products/tshirt-noir/mockup-1-neutral.jpg"
            alt="Visage-roi tribal brodé sur t-shirt noir JEUNE RICHE"
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-contain"
          />
        </div>
      </section>

      {/* Temps 3 — le symbole en grand, l'axe bascule à droite */}
      <section className="grid gap-12 border-t border-line px-5 py-24 md:grid-cols-2 md:gap-20 md:px-10 md:py-32">
        <div className="relative order-2 aspect-square overflow-hidden bg-ink md:order-1">
          <Image
            src="/images/badge/badge-white-on-black.png"
            alt="Badge JEUNE RICHE"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        </div>
        <div className="order-1 flex flex-col justify-center md:order-2">
          <p className="text-label text-paper/35">03</p>
          <p className="mt-8 max-w-md font-editorial text-heading leading-[1.25] text-paper">
            JEUNE RICHE assume la tension entre le luxe et la rue, entre la discipline du
            minimalisme et la puissance d&apos;un symbole gravé.
          </p>
        </div>
      </section>

      {/* Temps 4 — clôture. Mesure étroite, vide tenu à droite. */}
      <section className="border-t border-line px-5 py-28 md:px-10 md:py-40">
        <p className="text-label text-paper/35">04</p>
        <h2 className="reveal mt-10 max-w-2xl font-editorial text-heading leading-[1.15] text-paper md:text-[3rem] md:leading-[1.12]">
          Un langage visuel qui se répète, se grave, se porte.
        </h2>
        <Link
          href="/catalogue"
          className="mt-14 inline-flex items-center gap-5 bg-paper px-8 py-4 text-label text-ink transition-colors duration-300 ease-editorial hover:bg-studio md:mt-20"
        >
          Voir la collection
          <svg width="26" height="8" viewBox="0 0 26 8" fill="none" aria-hidden>
            <path d="M0 4h24M21 1l3.5 3L21 7" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
