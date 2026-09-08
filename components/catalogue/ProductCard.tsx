import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { ProductCardData } from "@/types";

// Une seule idée d'interaction : le passage face → dos au survol.
//
// La carte cumulait auparavant un tilt 3D (rotateX/rotateY sur ressorts), un
// glow radial suivant la souris et un scale — trois effets superposés sur une
// zone dont le seul rôle est de montrer un vêtement. Tout est retiré : plus de
// framer-motion, plus d'état React, plus de ref. Le survol est une simple
// transition d'opacité en CSS, ce qui rend aussi le composant rendable côté
// serveur.
//
// Le cadre passe en 5/4 : les 27 visuels produit réels sont tous en paysage
// (1,25 pour vingt d'entre eux, ~1,40 pour les mockups du t-shirt noir).
// Aucun n'est en portrait — le cadre 4/5 qui était utilisé réduisait donc
// systématiquement le vêtement à une vignette au centre d'un aplat de studio.
// Aucune apparition en cascade ici : le catalogue est silencieux, les pièces
// sont là. Un contenu qui démarre à opacité 0 et dépend d'une animation pour
// devenir lisible est fragile — constaté sur un onglet qui ne peint pas, où la
// grille restait vide plusieurs secondes. La règle est simple : le mouvement
// est réservé aux moments éditoriaux, jamais à de l'information dense.
export default function ProductCard({ product }: { product: ProductCardData }) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const inStock = product.variants.some((v) => v.stock > 0);

  return (
    <article>
      <Link href={`/catalogue/${product.slug}`} className="group block">
        <div className="relative aspect-[5/4] overflow-hidden bg-studio">
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={
                secondary
                  ? "object-contain transition-opacity duration-500 ease-editorial group-hover:opacity-0"
                  : "object-contain"
              }
            />
          )}
          {secondary && (
            <Image
              src={secondary.url}
              alt={secondary.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-contain opacity-0 transition-opacity duration-500 ease-editorial group-hover:opacity-100"
            />
          )}
        </div>

        {/* Informations sous l'image, alignées à gauche. La rupture de stock
            est une ligne de texte factuelle, pas une pastille posée sur la
            photo. */}
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-label text-paper/35">{product.category.name}</p>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <p className="font-editorial text-body text-paper transition-colors duration-300 ease-editorial group-hover:text-paper/70">
              {product.name}
            </p>
            <p className="shrink-0 text-caption text-paper/60">{formatPrice(product.price)}</p>
          </div>
          {!inStock && <p className="mt-2 text-label text-paper/40">Indisponible</p>}
        </div>
      </Link>
    </article>
  );
}
