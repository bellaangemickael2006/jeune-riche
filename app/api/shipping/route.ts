import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/data/settings";

// Lu par la page /checkout pour savoir si le panier atteint le seuil de
// livraison offerte — la même valeur que celle relue côté serveur dans
// /api/checkout, jamais recalculée côté client. Les frais de livraison
// eux-mêmes ne sont plus un montant fixe : ils varient selon la destination
// et sont communiqués au client par message, pas affichés/facturés ici.
export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    freeShippingThreshold:
      settings?.freeShippingThreshold !== null && settings?.freeShippingThreshold !== undefined
        ? Number(settings.freeShippingThreshold)
        : null,
  });
}
