import "server-only";
import { redisConfig, redisPipeline } from "@/lib/redis";

// Anti-doublon de commande. Le checkout envoie un identifiant unique par
// tentative (en-tête Idempotency-Key) et le renvoie tel quel s'il retente
// (réseau coupé, nouvel essai automatique au retour de la connexion). Si la
// première requête a bien créé la commande mais que la réponse s'est perdue,
// le nouvel essai reçoit la MÊME commande au lieu d'en créer une seconde.
//
// Stocké 24 h dans Upstash. Sans Upstash, ou s'il ne répond pas : pas de
// protection, la commande passe normalement (jamais bloquée pour ça).

const TTL_SECONDS = 24 * 60 * 60;
const PENDING = "en-cours";
const key = (id: string) => `jr:idem:checkout:${id}`;

export function isIdempotencyKey(value: string | null): value is string {
  return Boolean(value && /^[A-Za-z0-9-]{16,64}$/.test(value));
}

export type IdempotencyClaim =
  | { state: "new" } // première fois : traiter la commande
  | { state: "done"; response: unknown } // déjà traitée : renvoyer la même réponse
  | { state: "pending" } // une requête identique est en cours de traitement
  | { state: "unavailable" }; // pas de protection possible : traiter normalement

export async function claimIdempotencyKey(id: string): Promise<IdempotencyClaim> {
  if (!redisConfig()) return { state: "unavailable" };
  try {
    const [set, get] = await redisPipeline(
      [
        ["SET", key(id), PENDING, "NX", "EX", String(TTL_SECONDS)],
        ["GET", key(id)],
      ],
      1500
    );
    if (set?.result === "OK") return { state: "new" };
    if (get?.result === PENDING) return { state: "pending" };
    if (typeof get?.result === "string") return { state: "done", response: JSON.parse(get.result) };
    return { state: "unavailable" };
  } catch (error) {
    console.error("[checkout] anti-doublon indisponible:", error);
    return { state: "unavailable" };
  }
}

/** Commande créée : la réponse est gardée pour un éventuel nouvel essai. */
export async function completeIdempotencyKey(id: string, response: unknown) {
  try {
    await redisPipeline([["SET", key(id), JSON.stringify(response), "EX", String(TTL_SECONDS)]], 1500);
  } catch (error) {
    console.error("[checkout] anti-doublon (enregistrement):", error);
  }
}

/** Commande refusée (stock, article indisponible…) : le client peut corriger et réessayer. */
export async function releaseIdempotencyKey(id: string) {
  try {
    await redisPipeline([["DEL", key(id)]], 1500);
  } catch {
    // expirera seul
  }
}
