"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

export default function PanierPage() {
  const { lines, removeLine, setQuantity, total } = useCart();

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <h1 className="font-editorial text-4xl text-paper md:text-6xl">Panier</h1>

      {lines.length === 0 ? (
        <EmptyState
          message="Votre panier est vide."
          cta={{ label: "Voir le catalogue", href: "/catalogue" }}
        />
      ) : (
        <div className="mt-12 grid gap-12 md:grid-cols-[1fr_360px]">
          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li key={`${line.variantId}-${line.personalization ?? ""}`} className="flex gap-5 py-6">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden bg-line">
                  <Image src={line.image} alt={line.productName} fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-sm text-paper">{line.productName}</p>
                    <p className="mt-1 text-xs text-paper/50">{line.color} · {line.size}</p>
                    {line.personalization && (
                      <p className="mt-1 text-xs text-paper/50">
                        Personnalisation : <span className="text-paper">{line.personalization}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setQuantity(line.variantId, line.personalization, line.quantity - 1)}
                      className="h-7 w-7 border border-line text-paper"
                    >
                      −
                    </button>
                    <span className="text-paper">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(line.variantId, line.personalization, line.quantity + 1)}
                      className="h-7 w-7 border border-line text-paper"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeLine(line.variantId, line.personalization)}
                      className="ml-4 text-paper/40 underline underline-offset-4 hover:text-paper"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                <p className="text-sm text-paper">{formatPrice(line.unitPrice * line.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="h-fit border border-line p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-widest2 text-paper/50">Sous-total</span>
              <span className="text-paper">{formatPrice(total())}</span>
            </div>
            <p className="mt-2 text-xs text-paper/40">Frais de livraison calculés à l&apos;étape suivante.</p>
            <Link
              href="/checkout"
              className="mt-6 block w-full bg-blood py-4 text-center text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90"
            >
              Passer commande
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
