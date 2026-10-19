"use client";

import { useEffect } from "react";

/** Bouton « Imprimer » ; ouvre aussi la fenêtre d'impression à l'arrivée si demandé. */
export default function PrintButton({ label, auto }: { label: string; auto?: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // Laisse le temps aux polices et au rendu de se poser avant l'aperçu.
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black hover:bg-neutral-200"
    >
      {label}
    </button>
  );
}
