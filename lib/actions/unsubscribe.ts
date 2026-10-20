"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readUnsubscribeToken, UNSUBSCRIBE_KINDS, type UnsubscribeKind } from "@/lib/unsubscribe";

/** Désinscription confirmée par un clic (voir lib/unsubscribe.ts). */
export async function confirmUnsubscribe(kind: UnsubscribeKind, token: string) {
  if (!UNSUBSCRIBE_KINDS.includes(kind)) redirect("/desinscription");
  const email = readUnsubscribeToken(kind, token);
  if (!email) redirect(`/desinscription?type=${kind}&invalide=1`);

  try {
    if (kind === "rappel") {
      await prisma.abandonedCart.deleteMany({ where: { email } });
    } else {
      await prisma.newsletterSubscriber.deleteMany({ where: { email } });
    }
  } catch (error) {
    console.error("[desinscription]", error);
    redirect(`/desinscription?type=${kind}&erreur=1`);
  }
  redirect(`/desinscription?type=${kind}&fait=1`);
}
