"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOnline } from "@/lib/useOnline";

const WARM_KEY = "jr-offline-warmed-at";
const WARM_EVERY_MS = 6 * 60 * 60 * 1000; // au plus toutes les 6 heures

type NetworkInfo = { saveData?: boolean; effectiveType?: string };

/**
 * Lecture hors connexion :
 *  - bandeau quand le réseau tombe (les pages affichées sont alors la
 *    dernière version enregistrée, le panier reste gardé) ;
 *  - une fois la page chargée, sur une bonne connexion seulement, demande au
 *    service worker (public/sw.js) de garder d'avance le catalogue et les
 *    fiches produit. Jamais avec l'économie de données ni en 2G : ce serait
 *    du forfait consommé pour rien.
 */
export default function OfflineSupport() {
  const { t } = useTranslation();
  const online = useOnline();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !navigator.onLine) return;
    const network = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (network?.saveData || /2g/.test(network?.effectiveType ?? "")) return;
    try {
      if (Date.now() - Number(localStorage.getItem(WARM_KEY) ?? 0) < WARM_EVERY_MS) return;
    } catch {
      return;
    }

    let cancelled = false;
    // Après le chargement de la page, pour ne jamais la ralentir.
    const timer = setTimeout(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const res = await fetch("/api/offline/pages");
        const { pages } = (await res.json()) as { pages?: string[] };
        if (cancelled || !registration.active || !pages?.length) return;
        registration.active.postMessage({ type: "warm", urls: pages });
        localStorage.setItem(WARM_KEY, String(Date.now()));
      } catch {
        // Best-effort : la lecture hors connexion n'est qu'un plus.
      }
    }, 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-0 z-50 bg-paper px-5 py-3 text-center text-caption text-ink">
      {t("offline.banner")}
    </div>
  );
}
