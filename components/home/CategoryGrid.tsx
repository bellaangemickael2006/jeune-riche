import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  { name: "T-shirt", slug: "t-shirt", image: "/images/products/tshirt-noir/mockup-1.png" },
  { name: "Polo", slug: "polo", image: "/images/products/polo-marine/mockup-front-back.jpg" },
  { name: "Chemise", slug: "chemise", image: "/images/products/chemise-blanche/mockup-front-back.jpg" },
  { name: "Débardeur", slug: "debardeur", image: "/images/products/debardeur-noir/mockup-front-back.jpg" },
  { name: "Jogger", slug: "jogger", image: "/images/products/jogger-gris/mockup-front-back.jpg" },
  { name: "Casquette", slug: "casquette", image: "/images/products/casquette-blanche/mockup-front-back.jpg" },
];

export default function CategoryGrid() {
  return (
    <section className="px-5 py-20 md:px-10 md:py-32">
      <div className="mb-12 flex items-end justify-between">
        <h2 className="font-display text-3xl uppercase text-paper md:text-5xl">Catégories</h2>
        <Link
          href="/catalogue"
          className="hidden text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper md:block"
        >
          Tout le catalogue
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/catalogue?categorie=${cat.slug}`}
            className="group relative aspect-[3/4] overflow-hidden bg-line"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-editorial group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 font-display text-lg uppercase text-paper md:text-2xl">
              {cat.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
