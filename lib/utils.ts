import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Franc CFA (XOF) — devise réelle de la marque (Afrique de l'Ouest francophone).
export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Prix à définir";
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(n);
}

// Teintes réelles mesurées sur les photos produit (pas une convention
// générique) — sert à afficher un vrai nuancier plutôt qu'un bouton texte.
const SWATCH_COLORS: Record<string, string> = {
  Noir: "#0B0B0B",
  Blanc: "#EFEFEF",
  Blanche: "#EFEFEF",
  Taupe: "#958178",
  Marine: "#26365A",
  Gris: "#6A6E6D",
};

export function swatchColor(colorName: string): string {
  return SWATCH_COLORS[colorName] ?? "#71706C";
}

export function sanitizePersonalization(input: string, maxLen = 16): string {
  return input
    .replace(/[^a-zA-Z0-9À-ÿ _-]/g, "")
    .slice(0, maxLen);
}

// `||` (pas `??`) : Vercel peut définir la variable comme chaîne vide plutôt
// que de l'omettre, ce que `??` laisserait passer et casserait `new URL("")`.
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

// Même numéro que le bouton WhatsApp flottant (components/ui/WhatsappButton.tsx).
export const WHATSAPP_NUMBER = "2250777585367";

// Construit un lien WhatsApp pré-rempli pour un produit précis — la couleur et
// la taille sélectionnées sont incluses dans le message quand elles sont
// connues, pour que le client n'ait rien à retaper à l'ouverture de la
// conversation. En Côte d'Ivoire, WhatsApp convertit souvent mieux qu'un
// tunnel de paiement web classique : ce lien sert de canal de vente assisté,
// pas seulement de contact générique.
export function whatsappProductLink(
  productName: string,
  options?: { color?: string; size?: string; url?: string }
): string {
  const lines = [`Bonjour, je suis intéressé·e par le produit "${productName}"`];
  if (options?.color) lines.push(`Couleur : ${options.color}`);
  if (options?.size) lines.push(`Taille : ${options.size}`);
  if (options?.url) lines.push(options.url);
  const message = lines.join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export type DropCountdownInfo = { target: string; label: string } | null;

// Décide si un drop justifie un compte à rebours visible, et vers quelle
// date. Basé sur les VRAIES dates (startsAt/endsAt), pas sur le statut
// choisi à la main par un admin : un drop resté sur COMING_SOON après sa
// date de lancement (statut non mis à jour) doit quand même basculer sur le
// compte à rebours de fin s'il en a une, plutôt que de rester silencieux
// jusqu'à ce qu'un admin pense à changer le statut. SOLD_OUT/ENDED restent
// un override explicite qui masque toujours le compte à rebours.
export function getDropCountdown(
  drop: { status: string; startsAt: Date | string; endsAt: Date | string | null } | null | undefined
): DropCountdownInfo {
  if (!drop) return null;
  if (drop.status === "SOLD_OUT" || drop.status === "ENDED") return null;

  const now = Date.now();
  const startsAt = new Date(drop.startsAt);
  if (startsAt.getTime() > now) return { target: startsAt.toISOString(), label: "Disponible dans" };

  if (drop.endsAt) {
    const endsAt = new Date(drop.endsAt);
    if (endsAt.getTime() > now) return { target: endsAt.toISOString(), label: "Se termine dans" };
  }

  return null;
}
