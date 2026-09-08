import Image from "next/image";
import Link from "next/link";

export type ShowcaseItem = {
  name: string;
  slug: string;
  categoryName: string;
  image: string | null;
};

// Rythme éditorial : les colonnes sont inégales et l'axe bascule à chaque
// rangée (7/5 → 5/7 → 7/5). La grille existe, mais elle ne se lit pas comme
// une grille de design system — c'est le décalage qui donne la tension.
const SPANS = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7", "md:col-span-7", "md:col-span-5"];

// Toutes les tuiles sont en paysage. Les visuels disponibles sont des paires
// face+dos au format paysage (~1600×1290) : les enfermer dans un cadre
// portrait 4/5, comme c'était le cas, réduisait le vêtement à une vignette
// perdue au centre d'un aplat de studio — la casquette blanche disparaissait
// complètement. Le cadre suit l'asset, pas l'inverse.
export default function ProductShowcase({ items }: { items: ShowcaseItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-12 md:gap-y-20">
      {items.map((item, i) => (
        <article key={item.slug} className={SPANS[i % SPANS.length]}>
          <Link href={`/catalogue/${item.slug}`} className="group block">
            {/* 5/4 ≈ le ratio réel des mockups (~1,25) : en object-contain le
                vêtement remplit le cadre au lieu de flotter au centre, et le
                léger letterbox est invisible puisque le fond de l'image est
                déjà `studio`. Aucun recadrage : object-cover couperait les cols
                et les ourlets. */}
            <div className="relative aspect-[5/4] overflow-hidden bg-studio">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="object-contain transition-transform duration-700 ease-editorial group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-full w-full bg-line" />
              )}
            </div>
            {/* Nom et catégorie sous l'image, alignés à gauche — jamais posés
                par-dessus la photo sur un voile dégradé. */}
            <div className="mt-4 border-t border-line pt-3">
              <p className="text-label text-paper/35">{item.categoryName}</p>
              <p className="mt-2 font-editorial text-heading text-paper transition-colors duration-300 ease-editorial group-hover:text-paper/70">
                {item.name}
              </p>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
