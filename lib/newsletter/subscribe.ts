import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail, newsletterWelcomeEmail } from "@/lib/email";
import type { SubscribeSource } from "@/lib/newsletter/confirm";

/**
 * Inscrit l'adresse (une fois confirmée) et envoie l'email de bienvenue à la
 * première inscription seulement. Renvoie false si elle était déjà inscrite.
 */
export async function subscribe(email: string, source: SubscribeSource): Promise<boolean> {
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) return false;
  await prisma.newsletterSubscriber.create({ data: { email, source } });
  await sendEmail({ to: email, subject: "Bienvenue chez JEUNE RICHE", html: newsletterWelcomeEmail() });
  return true;
}
