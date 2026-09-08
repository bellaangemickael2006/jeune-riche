import Link from "next/link";
import ProductShowcase, { type ShowcaseItem } from "@/components/home/ProductShowcase";

// 02 — LA GAMME.
//
// Le marquee « Jeune Riche • Jeune Riche • … » qui ouvrait cette section a été
// retiré : une bande de marque en défilement infini est un dispositif de
// template, elle ajoutait une troisième idée d'interaction à un écran qui en
// avait déjà trop, et elle ne dit rien. Le titre n'est plus en WordPullUp : le
// mot y était placé à y:110% dans un masque `overflow-hidden`, donc invisible
// tant que l'animation ne partait pas — constaté en production.
export default function CategoryGrid({ items }: { items: ShowcaseItem[] }) {
  return (
    <section className="px-5 py-24 md:px-10 md:py-36">
      <div className="reveal flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-label text-paper/40">02 — La gamme</p>
        <Link
          href="/catalogue"
          className="text-label text-paper/40 transition-colors duration-300 ease-editorial hover:text-paper"
        >
          Tout voir
        </Link>
      </div>

      <h2 className="reveal reveal-1 mt-14 max-w-2xl font-editorial text-heading leading-[1.1] text-paper md:mt-20 md:text-heading-lg">
        Le visage-roi sur chaque pièce.
      </h2>

      <div className="mt-14 md:mt-24">
        {items.length > 0 ? (
          <ProductShowcase items={items} />
        ) : (
          <p className="border-t border-line pt-6 text-body text-paper/40">
            Aucune pièce publiée pour le moment.
          </p>
        )}
      </div>
    </section>
  );
}
