"use client";

import { useEffect } from "react";

// Enregistré uniquement en production : un service worker actif en dev
// interfère avec le Fast Refresh de Next (assets webpack recompilés à
// chaque changement, que le SW servirait depuis un cache périmé) — piège
// classique qui fait perdre du temps à déboguer un "changement qui ne
// s'applique jamais".
export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort : l'absence de service worker ne doit jamais empêcher
      // le site de fonctionner normalement en ligne.
    });
  }, []);

  return null;
}
