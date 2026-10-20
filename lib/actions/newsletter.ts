"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth";
import { sendEmail, campaignEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { ActionError, runAction, type ActionResult } from "@/lib/actions/result";

export async function sendCampaign(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("newsletter");

    const subject = String(formData.get("subject") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!subject || !body) throw new ActionError("Objet et message requis.");

    const subscribers = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
    if (subscribers.length === 0) throw new ActionError("Aucun abonné à qui envoyer la campagne.");

    // Un HTML par abonné (son lien de désinscription signé). Envoi par lots
    // de 5 en parallèle plutôt qu'un par un, pour rester sous la durée maximale
    // d'une fonction serverless avec quelques centaines d'abonnés.
    let sent = 0;
    for (let i = 0; i < subscribers.length; i += 5) {
      const batch = subscribers.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(({ email }) =>
          sendEmail({ to: email, subject, html: campaignEmail(body, unsubscribeUrl("newsletter", email)) })
        )
      );
      sent += results.filter((r) => r.sent).length;
    }

    revalidatePath("/admin/newsletter");
    return `Envoyé à ${sent}/${subscribers.length} abonné(s).`;
  });
}

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdminAction("newsletter");
    await prisma.newsletterSubscriber.delete({ where: { id } });
    revalidatePath("/admin/newsletter");
  });
}
