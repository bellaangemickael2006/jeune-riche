// Partagé entre le formulaire (client) et l'action serveur : volontairement
// sans aucune dépendance, pour ne pas embarquer Prisma côté navigateur.

/** Mot à taper pour confirmer le formatage des données (Paramètres). */
export const RESET_CONFIRMATION = "FORMATER";

/** Insensible à la casse et aux espaces : « formater » confirme aussi. */
export function isResetConfirmed(value: unknown) {
  return String(value ?? "").trim().toUpperCase() === RESET_CONFIRMATION;
}
