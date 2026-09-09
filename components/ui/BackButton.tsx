"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Un produit peut être atteint depuis le catalogue, l'accueil, un drop ou une
// recherche — router.back() ramène toujours au bon endroit, contrairement à
// un lien fixe qui supposerait toujours "venu du catalogue". `fallbackHref`
// couvre le cas d'une arrivée directe (lien partagé, nouvel onglet) où il
// n'y a rien dans l'historique à quoi revenir.
export default function BackButton({
  label = "Retour",
  fallbackHref = "/",
  className,
}: {
  label?: string;
  fallbackHref?: string;
  className?: string;
}) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("text-label text-paper/50 transition-colors hover:text-paper", className)}
    >
      ← {label}
    </button>
  );
}

// Version lien statique pour les cas où la destination doit toujours être la
// même page précise, quel que soit le chemin d'arrivée (ex. depuis un email).
export function BackLink({
  href,
  label = "Retour",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("text-label text-paper/50 transition-colors hover:text-paper", className)}>
      ← {label}
    </Link>
  );
}
