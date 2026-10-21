// Droits d'accès à l'administration — partagés entre le serveur (contrôle),
// le menu (liens visibles) et la page Équipe (cases à cocher).
//
// Propriétaire = administrateur SANS liste de droits : accès total, seul à
// gérer l'équipe et à formater les données. Employé = administrateur avec une
// liste : uniquement les sections cochées.

export const PERMISSIONS = {
  statistiques: { label: "Chiffres du tableau de bord", hint: "Chiffre d'affaires, ventes, conversion" },
  commandes: { label: "Commandes", hint: "Liste, statuts, bons, export" },
  produits: { label: "Produits et stock", hint: "Produits, catégories, drops, stock" },
  clients: { label: "Clients", hint: "Fiches clients, export" },
  avis: { label: "Avis", hint: "Modération des avis clients" },
  promos: { label: "Codes promo", hint: "Création et suivi" },
  newsletter: { label: "Newsletter", hint: "Abonnés et campagnes" },
  accueil: { label: "Page d'accueil", hint: "Images et textes" },
  parametres: { label: "Paramètres", hint: "Email, téléphone, livraison (sans le formatage)" },
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

/** null = propriétaire (tous les droits). */
export type AdminPermissions = Permission[] | null;

export function hasPermission(permissions: AdminPermissions, permission: Permission) {
  return permissions === null || permissions.includes(permission);
}

/** Garde uniquement des droits connus, sans doublon (données venant d'un formulaire ou de la base). */
export function cleanPermissions(raw: unknown): Permission[] {
  if (!Array.isArray(raw)) return [];
  return ALL_PERMISSIONS.filter((p) => raw.includes(p));
}

/** Section du menu admin → droit nécessaire (absent = accessible à tous les admins). */
export const LINK_PERMISSION: Record<string, Permission | "proprietaire"> = {
  "/admin/accueil": "accueil",
  "/admin/produits": "produits",
  "/admin/stock": "produits",
  "/admin/categories": "produits",
  "/admin/commandes": "commandes",
  "/admin/clients": "clients",
  "/admin/avis": "avis",
  "/admin/drops": "produits",
  "/admin/codes-promo": "promos",
  "/admin/newsletter": "newsletter",
  "/admin/parametres": "parametres",
  "/admin/equipe": "proprietaire",
  "/admin/journal": "proprietaire",
  "/admin/sauvegardes": "proprietaire",
};

export function canSeeLink(permissions: AdminPermissions, href: string) {
  const required = LINK_PERMISSION[href];
  if (!required) return true;
  if (required === "proprietaire") return permissions === null;
  return hasPermission(permissions, required);
}
