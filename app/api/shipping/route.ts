import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/data/settings";

// Lu par la page /checkout pour afficher le vrai montant de livraison avant
// confirmation — les mêmes valeurs que celles relues et appliquées
// côté serveur dans /api/checkout, jamais recalculées côté client.
export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({
    shippingCost: Number(settings?.shippingCost ?? 0),
    freeShippingThreshold:
      settings?.freeShippingThreshold !== null && settings?.freeShippingThreshold !== undefined
        ? Number(settings.freeShippingThreshold)
        : null,
  });
}
