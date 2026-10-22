import "server-only";
import { createECDH } from "node:crypto";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/utils";
import { VAPID_PUBLIC_KEY, vapidPrivateKey } from "@/lib/push/keys";
import { isFinalStatus, orderPushMessage, orderScope, userScope, type OrderPushEvent } from "@/lib/push/messages";

/** Clé publique qui correspond à une clé privée P-256, en base64url. */
function publicKeyOf(privateKey: string): string | null {
  try {
    const ecdh = createECDH("prime256v1");
    ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));
    return ecdh.getPublicKey().toString("base64url");
  } catch {
    return null;
  }
}

let warned = false;

/**
 * Clés VAPID, ou null (rien n'est alors envoyé) si la clé privée manque sur
 * Vercel ou ne forme pas une paire avec la clé publique du code (ancienne
 * clé, dont celle qui a fuité) : elle est vérifiée, pas supposée.
 */
export function vapidKeys() {
  const privateKey = vapidPrivateKey(process.env.VAPID_PRIVATE_KEY);
  if (!privateKey) return null;
  if (publicKeyOf(privateKey) !== VAPID_PUBLIC_KEY) {
    if (!warned) console.error("[push] VAPID_PRIVATE_KEY ne correspond pas à la clé publique de lib/push/keys.ts.");
    warned = true;
    return null;
  }
  return { publicKey: VAPID_PUBLIC_KEY, privateKey };
}

/**
 * Prévient les appareils abonnés à cette commande (page Suivi) et au compte
 * de son client. Best-effort, appelé après la réponse : un envoi raté ne
 * gêne jamais l'admin. Les abonnements que le navigateur a résiliés
 * (réponse 404/410) sont supprimés.
 */
export async function sendOrderPush(params: {
  orderId: string;
  userId: string | null;
  orderNumber: string;
  event: OrderPushEvent;
}) {
  const keys = vapidKeys();
  if (!keys) return;
  const { orderId, userId, orderNumber, event } = params;
  const scopes = [orderScope(orderId), ...(userId ? [userScope(userId)] : [])];

  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { scope: { in: scopes } } });
    // Un même téléphone abonné à la commande ET au compte : une seule notification.
    const unique = [...new Map(subscriptions.map((s) => [s.endpoint, s])).values()];
    const gone: string[] = [];

    await Promise.all(
      unique.map(async (sub) => {
        const message = orderPushMessage(event, orderNumber, sub.locale);
        if (!message) return;
        const url =
          sub.scope === orderScope(orderId) ? `/suivi?commande=${encodeURIComponent(orderNumber)}` : "/compte";
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ ...message, url, tag: `commande-${orderNumber}` }),
            {
              vapidDetails: {
                subject: siteUrl(),
                ...keys,
              },
              TTL: 24 * 3600,
              timeout: 5000,
            }
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) gone.push(sub.endpoint);
          else console.error("[push] envoi échoué:", status ?? error);
        }
      })
    );

    if (gone.length) await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } });
    if (event.kind === "status" && isFinalStatus(event.status)) {
      await prisma.pushSubscription.deleteMany({ where: { scope: orderScope(orderId) } });
    }
  } catch (error) {
    // Table absente avant la migration, base indisponible… : jamais bloquant.
    console.error("[push] notifications non envoyées:", error);
  }
}
