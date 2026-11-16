import Image from "next/image";
import Link from "next/link";
import WordPullUp from "@/components/ui/WordPullUp";
import FadeIn from "@/components/ui/FadeIn";
import { getServerTranslation } from "@/lib/i18n/server";
import { DEFAULT_LOOKBOOK_TEXT, RATIOS, type HomeContent } from "@/lib/home/content";
import { cn } from "@/lib/utils";
import { getPublishedProducts } from "@/lib/data/products";
import LookHotspots, { type LookHotspot } from "@/components/home/LookHotspots";

// Photos portées de la marque, réglées dans Admin → Page d'accueil (ajout,
// ordre, format, cadrage, légende, lien). Les deux photos d'origine gardent
// leurs textes traduits tant que l'admin n'en saisit pas d'autres.
const GRID: Record<1 | 2 | 3, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};
const SIZES: Record<1 | 2 | 3, string> = {
  1: "100vw",
  2: "(max-width: 768px) 100vw, 45vw",
  3: "(max-width: 768px) 100vw, 30vw",
};

// Positions des points sur la première photo — approximatives, à ajuster sur
// la vraie image. Chaque point ouvre une pièce publiée (les trois premières).
const HOTSPOT_POSITIONS = [
  { x: 50, y: 28 },
  { x: 50, y: 52 },
  { x: 50, y: 78 },
] as const;

export default async function Lookbook({ content }: { content: HomeContent["lookbook"] }) {
  const { t } = await getServerTranslation();
  const products = await getPublishedProducts();
  const hotspots: LookHotspot[] = products.slice(0, HOTSPOT_POSITIONS.length).map((p, i) => ({
    id: i,
    ...HOTSPOT_POSITIONS[i],
    name: p.name,
    href: `/catalogue/${p.slug}`,
  }));

  return (
    <section className="py-20 md:py-32">
      <div className="mb-10 flex items-end justify-between px-5 md:px-10">
        <WordPullUp
          text={content.title || t("home.wornTitle")}
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

      <div className={cn("grid grid-cols-1 gap-x-6 gap-y-10 px-5 md:px-10", GRID[content.columns])}>
        {content.items.map((shot, i) => {
          const defaults = DEFAULT_LOOKBOOK_TEXT[shot.id];
          const alt = shot.alt || (defaults ? t(defaults.altKey) : "JEUNE RICHE");
          const caption = shot.caption || (defaults ? t(defaults.captionKey) : "");
          const picture = (
            <div className="relative overflow-hidden bg-ink" style={{ aspectRatio: RATIOS[shot.ratio] }}>
              <Image
                src={shot.url}
                alt={alt}
                fill
                sizes={SIZES[content.columns]}
                className={cn("object-cover", shot.href && "transition-transform duration-700 ease-editorial group-hover:scale-[1.03]")}
                style={{ objectPosition: `${shot.focusX}% ${shot.focusY}%` }}
              />
            </div>
          );
          return (
            <FadeIn key={shot.id} y={20} delay={Math.min(i, 5) * 0.08}>
              {shot.href ? (
                <Link href={shot.href} className="group block">
                  {picture}
                </Link>
              ) : i === 0 && hotspots.length > 0 ? (
                // Première photo sans lien propre : points vers les pièces.
                <LookHotspots hotspots={hotspots}>{picture}</LookHotspots>
              ) : (
                picture
              )}
              {caption && <p className="mt-3 text-xs uppercase tracking-widest2 text-paper/60">{caption}</p>}
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
