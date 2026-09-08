import Link from "next/link";

// État vide éditorial : une phrase et une sortie. Le crest en filigrane à 4%
// d'opacité qui remplissait le cadre est retiré — invisible, donc pas une
// information, et le crest n'a pas à servir de motif de remplissage. Le bloc
// n'est plus une boîte centrée : il suit l'axe gauche du reste du site.
export default function EmptyState({
  message,
  cta,
}: {
  message: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mt-16 border-t border-line py-20 md:py-28">
      <p className="max-w-md font-editorial text-heading text-paper/70">{message}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-8 inline-block border-b border-line pb-1 text-label text-paper/60 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
