"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

// Déclenche la réhydratation depuis localStorage une fois montés côté
// client (skipHydration: true sur les deux stores) — évite toute
// différence entre le HTML serveur et le premier rendu client.
export default function StoreHydration() {
  useEffect(() => {
    useCart.persist.rehydrate();
    useWishlist.persist.rehydrate();
    // Marqueur explicite de fin d'hydratation des stores persistés. Avant ce
    // point, les boutons « Ajouter » et « Ajouter aux favoris » sont bien
    // affichés (rendus côté serveur) mais leurs gestionnaires ne sont pas
    // encore attachés : un clic n'a aucun effet. Ce marqueur permet de le
    // constater — en test comme en débogage — au lieu de conclure à tort que
    // le panier ou les favoris sont cassés.
    document.documentElement.dataset.storesHydrated = "true";
  }, []);

  return null;
}
