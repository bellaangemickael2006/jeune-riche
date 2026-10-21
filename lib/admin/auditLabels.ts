// Libellés du journal d'activité de l'admin — sans dépendance (client et serveur).
// Une action = « section.verbe » ; la section sert au filtre de la page Journal.

export const AUDIT_SECTIONS = {
  connexion: "Connexions",
  commandes: "Commandes",
  produits: "Produits",
  stock: "Stock",
  drops: "Drops",
  categories: "Catégories",
  promos: "Codes promo",
  avis: "Avis",
  newsletter: "Newsletter",
  accueil: "Page d'accueil",
  parametres: "Paramètres",
  equipe: "Équipe",
  sauvegardes: "Sauvegardes",
} as const;

export type AuditSection = keyof typeof AUDIT_SECTIONS;

export const AUDIT_ACTIONS = {
  "connexion.reussie": "Connexion",
  "connexion.refusee": "Connexion refusée",
  "commandes.statut": "Statut de commande",
  "commandes.suivi": "Suivi / notes de commande",
  "produits.creation": "Produit créé",
  "produits.modification": "Produit modifié",
  "produits.suppression": "Produit supprimé",
  "produits.variante": "Variante ajoutée",
  "produits.variante_suppression": "Variante supprimée",
  "produits.media": "Médias du produit",
  "stock.modification": "Stock modifié",
  "drops.creation": "Drop créé",
  "drops.modification": "Drop modifié",
  "drops.suppression": "Drop supprimé",
  "drops.produits": "Produits d'un drop",
  "categories.creation": "Catégorie créée",
  "categories.modification": "Catégorie modifiée",
  "categories.suppression": "Catégorie supprimée",
  "promos.creation": "Code promo créé",
  "promos.activation": "Code promo activé / désactivé",
  "promos.suppression": "Code promo supprimé",
  "avis.moderation": "Avis modéré",
  "avis.suppression": "Avis supprimé",
  "newsletter.campagne": "Campagne envoyée",
  "newsletter.suppression": "Abonné retiré",
  "accueil.modification": "Page d'accueil modifiée",
  "accueil.reinitialisation": "Page d'accueil réinitialisée",
  "parametres.modification": "Paramètres modifiés",
  "parametres.formatage": "Formatage des données",
  "equipe.ajout": "Membre ajouté",
  "equipe.modification": "Accès modifiés",
  "equipe.retrait": "Membre retiré",
  "sauvegardes.creation": "Sauvegarde faite",
  "sauvegardes.telechargement": "Sauvegarde téléchargée",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export function auditSection(action: string): AuditSection | null {
  const section = action.split(".")[0];
  return section in AUDIT_SECTIONS ? (section as AuditSection) : null;
}

export function auditLabel(action: string): string {
  return action in AUDIT_ACTIONS ? AUDIT_ACTIONS[action as AuditAction] : action;
}

/** Actions sensibles, mises en évidence dans le journal. */
export function isSensitiveAction(action: string): boolean {
  return (
    action === "connexion.refusee" ||
    action === "parametres.formatage" ||
    action.startsWith("equipe.") ||
    action === "sauvegardes.telechargement" ||
    action.endsWith("suppression")
  );
}

/** Filtres de la page Journal lus dans l'URL, jamais repris tels quels en base. */
export function parseJournalFilters(params: { section?: string; qui?: string; page?: string }) {
  const section = params.section && params.section in AUDIT_SECTIONS ? (params.section as AuditSection) : null;
  const qui = params.qui?.trim().toLowerCase().slice(0, 254) || null;
  const page = Math.min(Math.max(Number.parseInt(params.page ?? "1", 10) || 1, 1), 1000);
  return { section, qui, page };
}
