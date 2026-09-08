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
  }, []);

  return null;
}
