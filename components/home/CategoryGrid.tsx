import Link from "next/link";
import Marquee from "@/components/ui/Marquee";
import WordPullUp from "@/components/ui/WordPullUp";
import ProductShowcase, { type ShowcaseItem } from "@/components/home/ProductShowcase";
import { getServerTranslation } from "@/lib/i18n/server";
import type { HomeContent } from "@/lib/home/content";

export default async function CategoryGrid({ items, content }: { items: ShowcaseItem[]; content: HomeContent["pieces"] }) {
  const { t } = await getServerTranslation();

  return (
    <section className="py-20 md:py-32">
      <Marquee className="mb-16 border-y border-line py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="font-display flex items-center gap-6 whitespace-nowrap text-sm uppercase tracking-widest2 text-paper/60"
          >
            {content.marquee || "Jeune Riche"} <span className="text-paper/70">•</span>
          </span>
        ))}
      </Marquee>

      <div className="mb-10 flex items-end justify-between px-5 md:px-10">
        <WordPullUp
          text={content.title || t("home.ourPieces")}
          as="h2"
          className="font-display text-3xl uppercase text-paper md:text-5xl"
        />
        <Link
          href="/catalogue"
          className="hidden text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper md:block"
        >
          {t("home.viewFullCatalogue")}
        </Link>
      </div>

      {items.length > 0 ? (
        <ProductShowcase items={items} />
      ) : (
        <p className="px-5 text-sm text-paper/60 md:px-10">{t("home.noProducts")}</p>
      )}
    </section>
  );
}
