"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

// Reste à l'intérieur du layout admin (AdminSidebar visible) — l'admin peut
// toujours naviguer vers une autre section pendant qu'on répare le problème.
export default function AdminError({
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
    <div className="flex min-h-[50vh] flex-col items-start justify-center gap-4">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">Erreur</p>
      <h1 className="font-display text-2xl uppercase text-paper">Une erreur est survenue</h1>
      <p className="max-w-md text-sm text-paper/50">
        L&apos;équipe technique a été prévenue automatiquement.
      </p>
      <div className="mt-2 flex items-center gap-6">
        <button
          onClick={reset}
          className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          Réessayer
        </button>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
