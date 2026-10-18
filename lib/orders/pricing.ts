// Calculs de montants purs (sans base de données) : utilisés par le checkout
// et couverts par des tests unitaires. Les prix doivent toujours venir de la
// base, jamais du navigateur.

export type PricedLine = { unitPrice: number; quantity: number };

export function subtotalOf(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

/**
 * Remise d'un code promo. Un montant fixe ne peut jamais dépasser le sous-total,
 * et une remise en pourcentage est arrondie à l'unité la plus proche.
 */
export function discountOf(
  subtotal: number,
  promo: { type: "PERCENT" | "FIXED"; value: number }
): number {
  if (promo.type === "PERCENT") {
    const percent = Math.min(Math.max(promo.value, 0), 100);
    return Math.round(subtotal * (percent / 100));
  }
  return Math.min(Math.max(promo.value, 0), subtotal);
}

export function totalOf(subtotal: number, discount: number, shippingCost = 0): number {
  return Math.max(subtotal - discount, 0) + shippingCost;
}
