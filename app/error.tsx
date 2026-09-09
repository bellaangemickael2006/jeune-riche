"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

// Filet pour toute erreur survenant sous le layout racine (page, composant
// serveur ou client qui plante) — contrairement à global-error.tsx, celui-ci
// reste À L'INTÉRIEUR du layout racine : header, footer et thème restent
// visibles, l'utilisateur peut toujours naviguer ailleurs sur le site.
// global-error.tsx reste le seul filet pour un plantage du layout racine
// lui-même (là où même ce composant ne pourrait plus s'afficher).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">Erreur</p>
      <h1 className="font-editorial text-3xl text-paper md:text-4xl">Une erreur est survenue</h1>
      <p className="max-w-sm text-sm leading-relaxed text-paper/50">
        L&apos;équipe a été prévenue automatiquement. Réessayez, ou repartez de l&apos;accueil.
      </p>
      <div className="mt-2 flex items-center gap-6">
        <button
          onClick={reset}
          className="border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
