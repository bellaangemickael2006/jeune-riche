"use server";

import { redirect } from "next/navigation";
import { readSubscribeToken } from "@/lib/newsletter/confirm";
import { subscribe } from "@/lib/newsletter/subscribe";

/**
 * Confirmation d'inscription par un clic (voir lib/newsletter/confirm.ts).
 * Un bouton plutôt que le simple chargement du lien : les antivirus de
 * messagerie ouvrent les liens des emails et inscriraient sinon l'adresse
 * sans que la personne l'ait voulu.
 */
export async function confirmSubscription(token: string) {
  const data = readSubscribeToken(token);
  if (!data) redirect("/newsletter/confirmer?invalide=1");
  try {
    await subscribe(data.email, data.source);
  } catch (error) {
    console.error("[newsletter] confirmation:", error);
    redirect("/newsletter/confirmer?erreur=1");
  }
  redirect("/newsletter/confirmer?fait=1");
}
