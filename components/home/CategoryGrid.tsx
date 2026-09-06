import Link from "next/link";
import Marquee from "@/components/ui/Marquee";
import WordPullUp from "@/components/ui/WordPullUp";
import ProductShowcase, { type ShowcaseItem } from "@/components/home/ProductShowcase";

export default function CategoryGrid({ items }: { items: ShowcaseItem[] }) {
  return (
    <section className="py-20 md:py-32">
      <Marquee className="mb-16 border-y border-line py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="font-display flex items-center gap-6 whitespace-nowrap text-sm uppercase tracking-widest2 text-paper/30"
          >
            Jeune Riche <span className="text-blood">•</span>
          </span>
        ))}
      </Marquee>

      <div className="mb-10 flex items-end justify-between px-5 md:px-10">
        <WordPullUp
          text="Nos pièces"
          as="h2"
          className="font-display text-3xl uppercase text-paper md:text-5xl"
        />
        <Link
          href="/catalogue"
          className="hidden text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper md:block"
        >
          Tout le catalogue
        </Link>
      </div>

      {items.length > 0 ? (
        <ProductShowcase items={items} />
      ) : (
        <p className="px-5 text-sm text-paper/40 md:px-10">Aucun produit publié pour le moment.</p>
      )}
    </section>
  );
}
