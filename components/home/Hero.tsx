import Link from "next/link";

// Premier écran — 01 ENTRÉE.
//
// La vidéo `hero-production.mp4` a été retirée : elle est saturée du rouge
// retiré de la marque (ART_DIRECTION.md §2), elle contient déjà le wordmark
// « JEUNE RICHE » gravé en très grand — qui entrait en collision avec le H1
// posé par-dessus — et elle coûtait 20,8 Mo au premier écran mobile.
//
// Elle n'est remplacée par aucun autre asset : les seuls visuels disponibles
// sont des mockups produit sur fond de studio, et les présenter en plein cadre
// reviendrait à simuler une photographie de campagne qui n'existe pas. Le
// premier écran est donc typographique et volontairement vide — le vide est
// tenu, pas subi (§16). Deux rôles typographiques seulement : Fraunces porte
// l'affirmation, Inter tient les rails. Anton reste au wordmark du header.
const RANGE = [
  { label: "T-shirt", slug: "t-shirt" },
  { label: "Polo", slug: "polo" },
  { label: "Chemise", slug: "chemise" },
  { label: "Débardeur", slug: "debardeur" },
  { label: "Jogger", slug: "jogger" },
  { label: "Casquette", slug: "casquette" },
];

export default function Hero() {
  return (
    <section className="flex min-h-[100svh] flex-col bg-ink px-5 pb-8 pt-28 md:px-10 md:pb-10 md:pt-36">
      {/* Rail haut — situe la section dans la narration et ancre la marque. */}
      <div className="reveal flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-label text-paper/40">01 — La marque</p>
        <p className="text-label text-paper/25">Côte d&apos;Ivoire</p>
      </div>

      {/* Corps — affirmation calée en bas à gauche, toute la droite laissée
          vide. L'axe est le bord gauche de la page, jamais le centre. */}
      <div className="flex flex-1 items-end py-16 md:py-24">
        <div className="w-full md:w-7/12 lg:w-6/12">
          <h1 className="reveal reveal-1 font-editorial text-[2.5rem] leading-[1.05] text-paper md:text-[4.5rem] lg:text-[5.5rem]">
            Six pièces,
            <br />
            un visage gravé.
          </h1>

          <div className="reveal reveal-2 mt-10 md:mt-12">
            <Link
              href="/catalogue"
              className="group inline-flex items-center gap-5 bg-paper px-8 py-4 text-label text-ink transition-colors duration-300 ease-editorial hover:bg-studio"
            >
              Voir la collection
              <svg
                width="26"
                height="8"
                viewBox="0 0 26 8"
                fill="none"
                aria-hidden
                className="transition-transform duration-300 ease-editorial group-hover:translate-x-1"
              >
                <path d="M0 4h24M21 1l3.5 3L21 7" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Rail bas — la gamme réelle, typographiée comme un index. C'est de la
          navigation, pas de la décoration : six entrées, rien de plus. */}
      <nav
        aria-label="La gamme"
        className="reveal reveal-3 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-4 md:gap-x-10"
      >
        {RANGE.map((item) => (
          <Link
            key={item.slug}
            href={`/catalogue?categorie=${item.slug}`}
            className="text-label text-paper/40 transition-colors duration-300 ease-editorial hover:text-paper"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
