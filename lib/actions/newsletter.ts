"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendEmail, campaignEmail } from "@/lib/email";

export async function sendCampaign(formData: FormData) {
  await requireAdmin();

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) throw new Error("Objet et message requis.");

  const subscribers = await prisma.newsletterSubscriber.findMany({ select: { email: true } });

  let sent = 0;
  for (const { email } of subscribers) {
    const result = await sendEmail({ to: email, subject, html: campaignEmail(body) });
    if (result.sent) sent += 1;
  }

  revalidatePath("/admin/newsletter");
  return { sent, total: subscribers.length };
}
