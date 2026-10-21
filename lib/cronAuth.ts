import { safeEqual } from "@/lib/admin/gate";

/**
 * Appel légitime de Vercel Cron : en-tête « Authorization: Bearer
 * $CRON_SECRET ». Comparaison à temps constant (une comparaison ordinaire
 * s'arrête au premier caractère faux, ce qui peut, en mesurant les temps de
 * réponse, aider à deviner le secret). Sans CRON_SECRET : toujours refusé.
 */
export function isCronAuthorized(authorization: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorization) return false;
  return safeEqual(authorization, `Bearer ${secret}`);
}
