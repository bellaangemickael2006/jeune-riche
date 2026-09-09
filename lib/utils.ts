import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge ne connaît pas l'échelle typographique custom déclarée dans
// tailwind.config.ts (text-label, text-heading, ...) : sans cette extension,
// il les classe par défaut comme des couleurs de texte et supprime donc
// silencieusement tout text-{couleur} combiné avec elles dans un même cn()
// (ex. text-white text-heading -> seul text-heading survivait, texte rendu
// dans la couleur héritée au lieu de la couleur voulue).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": ["text-label", "text-caption", "text-body", "text-heading", "text-heading-lg", "text-display"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Seuil unique partagé entre l'alerte email admin (app/api/checkout) et
// l'urgence affichée au client (AddToCart) — les deux doivent toujours
// s'accorder sur ce qui compte comme "stock faible".
export const LOW_STOCK_THRESHOLD = 3;

// Franc CFA (XOF) — devise réelle de la marque (Afrique de l'Ouest
// francophone), toujours la même quelle que soit la langue d'affichage :
// seule la convention d'écriture des nombres (séparateurs, position du
// symbole) change avec `locale`, jamais la devise elle-même. `locale`
// accepte directement un code ISO 639-1 ("en", "ar"...) — Intl le résout
// très bien sans région complète. `undefinedLabel` reste optionnel et par
// défaut en français pour ne pas casser les appels pas encore mis à jour.
export function formatPrice(
  value: number | string | null | undefined,
  locale: string = "fr",
  undefinedLabel: string = "Prix à définir"
): string {
  if (value === null || value === undefined) return undefinedLabel;
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(locale, {
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
export const WHATSAPP_NUMBER = "2250700590504";

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

// Message envoyé sur WhatsApp juste après la confirmation d'une commande —
// le client atterrit directement dans la conversation avec tout le détail
// déjà rédigé, à envoyer en un tap. C'est le canal de contact principal
// (téléphone obligatoire au checkout) : la commande est déjà enregistrée en
// base à ce stade, ce message sert à amorcer l'échange pour le règlement et
// l'expédition, pas à la valider.
export function whatsappOrderLink(params: {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: { line1: string; city: string; postalCode?: string | null; country: string };
  items: {
    productName: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    personalization: string | null;
  }[];
  total: number;
  /** Code promo appliqué, s'il y en a un — pas encore persisté sur la
   * commande en base (voir app/api/checkout), donc ce message est pour
   * l'instant la seule trace lisible du code utilisé. */
  discount?: { code: string; amount: number } | null;
}): string {
  const lines = [
    `Bonjour, je viens de confirmer ma commande ${params.orderNumber} sur JEUNE RICHE.`,
    "",
    "Articles :",
    ...params.items.map((i) => {
      const detail = i.personalization ? ` (personnalisation : "${i.personalization}")` : "";
      return `- ${i.productName} — ${i.color}/${i.size} × ${i.quantity}${detail} — ${formatPrice(i.unitPrice * i.quantity)}`;
    }),
    ...(params.discount ? ["", `Code promo ${params.discount.code} : −${formatPrice(params.discount.amount)}`] : []),
    "",
    `Total : ${formatPrice(params.total)}`,
    "",
    `Nom : ${params.customerName}`,
    `Téléphone : ${params.phone}`,
    `Adresse : ${params.address.line1}, ${params.address.city}${params.address.postalCode ? " " + params.address.postalCode : ""}, ${params.address.country}`,
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// Message pré-rédigé pour chaque statut — l'admin garde le contrôle total
// (rien n'est envoyé automatiquement, WhatsApp n'offrant pas d'envoi
// serveur-à-serveur gratuit) : ce lien ouvre juste la conversation avec le
// bon texte déjà prêt, un clic remplace ce qui prenait avant une minute à
// retaper à la main pour chaque commande.
const STATUS_MESSAGES: Partial<Record<string, (orderNumber: string, trackingNumber?: string | null) => string>> = {
  CONFIRMEE: (ref) => `Bonjour, votre commande ${ref} chez JEUNE RICHE est confirmée — on prépare tout ça !`,
  PREPARATION: (ref) => `Bonjour, votre commande ${ref} chez JEUNE RICHE est en cours de préparation.`,
  EXPEDIEE: (ref, tracking) =>
    `Bonjour, votre commande ${ref} chez JEUNE RICHE vient d'être expédiée${tracking ? ` (suivi : ${tracking})` : ""}.`,
  LIVREE: (ref) => `Bonjour, votre commande ${ref} chez JEUNE RICHE a été livrée. Merci pour votre confiance !`,
  ANNULEE: (ref) => `Bonjour, votre commande ${ref} chez JEUNE RICHE a été annulée.`,
};

// Numéro client au format international sans "+" ni espaces, tel qu'exigé
// par wa.me — tolère les formats courants saisis au checkout (+225 07 00...,
// 07 00..., 2250700...). Le indicatif "225" est suivi du numéro à 10 chiffres
// SANS retirer le 0 initial : c'est le format déjà utilisé et vérifié
// fonctionnel par WHATSAPP_NUMBER ci-dessus (+225 07 00 59 05 04 ->
// 2250700590504), pas la convention internationale habituelle.
function sanitizePhoneForWhatsapp(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("225")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return `225${digits}`;
  return digits;
}

// Lien WhatsApp pré-rempli pour prévenir un client d'un changement de statut
// — null si le statut n'a pas de message dédié (ex. NOUVELLE, déjà su par le
// client) ou si aucun numéro n'est disponible.
export function whatsappStatusUpdateLink(
  status: string,
  orderNumber: string,
  phone: string | null | undefined,
  trackingNumber?: string | null
): string | null {
  const buildMessage = STATUS_MESSAGES[status];
  if (!buildMessage || !phone) return null;
  const number = sanitizePhoneForWhatsapp(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(buildMessage(orderNumber, trackingNumber))}`;
}

// `labelKey` plutôt qu'un libellé déjà en français : ce module n'a pas accès
// aux traductions (utilitaire pur, pas un composant) — c'est à l'appelant de
// résoudre `t(\`drops.countdown.${labelKey}\`)`.
export type DropCountdownInfo = { target: string; labelKey: "availableIn" | "endsIn" } | null;

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
  if (startsAt.getTime() > now) return { target: startsAt.toISOString(), labelKey: "availableIn" };

  if (drop.endsAt) {
    const endsAt = new Date(drop.endsAt);
    if (endsAt.getTime() > now) return { target: endsAt.toISOString(), labelKey: "endsIn" };
  }

  return null;
}
