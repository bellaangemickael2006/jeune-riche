import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";

// En production, Next.js masque le message des erreurs levées dans une server
// action : l'admin ne voyait qu'« Une erreur est survenue », jamais la raison
// (« produit présent dans une commande », « code déjà existant »…). Les
// actions admin renvoient donc leur erreur comme une valeur, affichée par
// <ActionForm>, au lieu de la lever.

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Erreur prévue, dont le message peut être montré tel quel à l'admin. */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toErrorResult(error: unknown): { ok: false; error: string } {
  // redirect() et notFound() passent par une exception interne : elle doit
  // continuer sa route, sinon la redirection n'a jamais lieu.
  unstable_rethrow(error);

  if (error instanceof ActionError) return { ok: false, error: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { ok: false, error: "Cette valeur existe déjà (nom, code ou référence en double)." };
    if (error.code === "P2003") {
      return { ok: false, error: "Impossible : cet élément est encore utilisé ailleurs (commande, alerte de stock…)." };
    }
    if (error.code === "P2025") return { ok: false, error: "Élément introuvable — il a peut-être déjà été supprimé." };
  }
  console.error("[admin action]", error);
  return { ok: false, error: "Une erreur inattendue est survenue. Réessayez." };
}

export async function runAction(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, ...(message ? { message } : {}) };
  } catch (error) {
    return toErrorResult(error);
  }
}

/** Variante de runAction pour une action qui renvoie des données au client. */
export async function runDataAction<T>(fn: () => Promise<T>): Promise<DataResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return toErrorResult(error);
  }
}

/** Lit un nombre entier positif ou nul d'un champ de formulaire ; vide → null. */
export function readInt(formData: FormData, name: string, label: string): number | null {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new ActionError(`${label} : nombre entier positif attendu.`);
  return value;
}

/** Lit un montant positif ou nul ; vide → null. */
export function readAmount(formData: FormData, name: string, label: string): number | null {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new ActionError(`${label} : montant positif attendu.`);
  return value;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Slug libre pour un modèle : « polo », puis « polo-2 », « polo-3 »… Deux
 * produits ou drops portant le même nom faisaient échouer la création sur la
 * contrainte d'unicité du slug.
 */
export async function uniqueSlug(name: string, exists: (slug: string) => Promise<boolean>) {
  const base = slugify(name) || "element";
  let slug = base;
  for (let i = 2; await exists(slug); i++) slug = `${base}-${i}`;
  return slug;
}
