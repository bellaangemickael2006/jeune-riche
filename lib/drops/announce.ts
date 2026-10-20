import "server-only";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendEmail, dropOpenEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { siteUrl } from "@/lib/utils";

/**
 * Ouvre les drops dont l'heure est arrivée et annonce chacun UNE seule fois
 * par email à la liste. Le passage « Bientôt / Précommande → Disponible »
 * est fait par une mise à jour conditionnelle : si plusieurs visiteurs (ou
 * le cron) arrivent en même temps, un seul la réussit et envoie les emails.
 *
 * Appelée après la réponse (sans ralentir la page) par /drops, la page d'un
 * drop et son API « en direct » — donc dès qu'un visiteur attend
 * l'ouverture — et au plus tard par le cron quotidien (app/api/cron/drops).
 */
export async function announceOpenedDrops(): Promise<{ opened: number; sent: number }> {
  const now = new Date();
  const due = await prisma.drop.findMany({
    where: {
      status: { in: ["COMING_SOON", "PRE_ORDER"] },
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
  });

  let opened = 0;
  let sent = 0;
  for (const drop of due) {
    const claimed = await prisma.drop.updateMany({
      where: { id: drop.id, status: drop.status },
      data: { status: "AVAILABLE" },
    });
    if (claimed.count === 0) continue; // déjà ouvert par un autre appel
    opened++;
    revalidateTag("products", "max");

    const subscribers = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
    const url = `${siteUrl()}/drops/${drop.slug}`;
    for (let i = 0; i < subscribers.length; i += 5) {
      const batch = subscribers.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(({ email }) =>
          sendEmail({
            to: email,
            subject: `Le drop ${drop.name} est ouvert`,
            html: dropOpenEmail({
              name: drop.name,
              description: drop.description,
              url,
              unsubscribeUrl: unsubscribeUrl("newsletter", email),
            }),
          })
        )
      );
      sent += results.filter((r) => r.sent).length;
    }
    console.info(`[drops] « ${drop.name} » ouvert, annonce envoyée à ${sent}/${subscribers.length}`);
  }
  return { opened, sent };
}

/** Variante « tâche de fond » : ne lève jamais d'erreur. */
export async function announceOpenedDropsSafely() {
  try {
    await announceOpenedDrops();
  } catch (error) {
    console.error("[drops] annonce d'ouverture:", error);
  }
}
