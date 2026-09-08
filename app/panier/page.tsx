"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

// Même langage que le tiroir : filets `line`, vignettes en object-contain sur
// `studio`, rôles typographiques nommés plutôt que des tailles arbitraires.
export default function PanierPage() {
  const { lines, removeLine, setQuantity, total } = useCart();

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="flex items-baseline justify-between border-b border-line pb-4">
        <p className="text-label text-paper/40">Panier</p>
        <Link
          href="/catalogue"
          className="text-label text-paper/40 transition-colors duration-300 ease-editorial hover:text-paper"
        >
          Continuer
        </Link>
      </div>

      <h1 className="mt-12 font-editorial text-heading-lg text-paper md:mt-16 md:text-[4rem] md:leading-[1]">
        Votre sélection
      </h1>

      {lines.length === 0 ? (
        <EmptyState
          message="Votre panier est vide."
          cta={{ label: "Voir la collection", href: "/catalogue" }}
        />
      ) : (
        <div className="mt-14 grid gap-14 md:mt-20 md:grid-cols-[1fr_360px] md:gap-20">
          <ul className="border-t border-line">
            {lines.map((line) => (
              <li
                key={`${line.variantId}-${line.personalization ?? ""}`}
                className="flex gap-5 border-b border-line py-7"
              >
                <div className="relative aspect-[5/4] w-32 shrink-0 overflow-hidden bg-studio md:w-40">
                  <Image
                    src={line.image}
                    alt={line.productName}
                    fill
                    className="object-contain"
                    sizes="160px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-editorial text-body text-paper">{line.productName}</p>
                      <p className="shrink-0 text-caption text-paper/70">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                    <p className="mt-1.5 text-caption text-paper/40">
                      {line.color} · {line.size}
                    </p>
                    {line.personalization && (
                      <p className="mt-1 text-caption text-paper/40">
                        Marquage : <span className="text-paper/80">{line.personalization}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setQuantity(line.variantId, line.personalization, line.quantity - 1)
                        }
                        className="h-8 w-8 border border-line text-paper/70 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <span className="min-w-4 text-center text-caption text-paper">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity(line.variantId, line.personalization, line.quantity + 1)
                        }
                        className="h-8 w-8 border border-line text-paper/70 transition-colors duration-300 ease-editorial hover:border-paper hover:text-paper"
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeLine(line.variantId, line.personalization)}
                      className="text-label text-paper/35 transition-colors duration-300 ease-editorial hover:text-paper"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="h-fit border-t border-line pt-6 md:sticky md:top-32">
            <div className="flex items-baseline justify-between">
              <span className="text-label text-paper/45">Sous-total</span>
              <span className="text-body text-paper">{formatPrice(total())}</span>
            </div>
            <p className="mt-3 text-caption text-paper/35">
              Frais de livraison calculés à l&apos;étape suivante.
            </p>
            <Link
              href="/checkout"
              className="mt-8 block w-full bg-paper py-4 text-center text-label text-ink transition-colors duration-300 ease-editorial hover:bg-studio"
            >
              Passer commande
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
