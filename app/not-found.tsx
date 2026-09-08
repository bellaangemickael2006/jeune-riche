import Link from "next/link";

// Une erreur se dit à plat, sans dramatisation ni motif de remplissage : le
// crest en filigrane à 3,5% d'opacité est retiré, la composition suit l'axe
// gauche du reste du site.
export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink px-5 pb-32 pt-32 md:px-10 md:pt-40">
      <div className="border-b border-line pb-4">
        <p className="text-label text-paper/40">404</p>
      </div>
      <div className="max-w-2xl pt-20 md:pt-28">
        <h1 className="font-editorial text-heading-lg leading-[1.05] text-paper md:text-[4rem]">
          Page introuvable
        </h1>
        <p className="mt-8 max-w-md text-body leading-relaxed text-paper/50">
          Cette page n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
          <Link
            href="/"
            className="border-b border-line pb-1 text-label text-paper/60 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/catalogue"
            className="border-b border-line pb-1 text-label text-paper/60 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
          >
            Voir la collection
          </Link>
        </div>
      </div>
    </div>
  );
}
