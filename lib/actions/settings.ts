"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActionError, readAmount, runAction, type ActionResult } from "@/lib/actions/result";
import { RESET_CONFIRMATION, isResetConfirmed } from "@/lib/demoReset";

const SETTINGS_ID = "default";
const MEDIA_BUCKET = "product-media";

export async function updateStoreSettings(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();

    const freeShippingThreshold = readAmount(formData, "freeShippingThreshold", "Livraison gratuite");
    const contactEmail = String(formData.get("contactEmail") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      throw new ActionError("Email de contact invalide.");
    }

    const data = {
      freeShippingThreshold,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    };
    await prisma.storeSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    revalidateTag("store-settings");
    revalidatePath("/admin/parametres");
    return "Paramètres enregistrés.";
  });
}

/**
 * Remise à zéro pour une démo. Ne touche jamais aux comptes administrateurs,
 * aux catégories ni aux paramètres de la boutique. Irréversible : protégé par
 * la saisie du mot de confirmation, revérifié ici côté serveur.
 */
export async function resetStoreData(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await requireAdmin();

    if (!isResetConfirmed(formData.get("confirmation"))) {
      throw new ActionError(`Tapez ${RESET_CONFIRMATION} pour confirmer le formatage.`);
    }

    const wipeClients = formData.get("clients") === "on";
    const wipeCatalogue = formData.get("catalogue") === "on";
    // Clients et catalogue sont référencés par les commandes, avis, paniers et
    // alertes : les effacer impose d'effacer l'activité d'abord.
    const wipeActivity = formData.get("activity") === "on" || wipeClients || wipeCatalogue;
    const wipeNewsletter = formData.get("newsletter") === "on";
    const zeroStock = formData.get("stock") === "on" && !wipeCatalogue;

    if (!wipeActivity && !wipeNewsletter && !zeroStock) {
      throw new ActionError("Cochez au moins un élément à formater.");
    }

    const clientAccounts = wipeClients
      ? await prisma.user.findMany({ where: { role: "CLIENT" }, select: { supabaseId: true } })
      : [];
    const productIds = wipeCatalogue ? (await prisma.product.findMany({ select: { id: true } })).map((p) => p.id) : [];

    // Transaction « en lot » (une seule requête, ordre garanti) plutôt
    // qu'interactive : à travers le pooler Supabase (pgbouncer), une
    // transaction interactive pouvait ne pas démarrer à temps (P2028) et le
    // formatage échouait sur « erreur inattendue ».
    const steps: { key?: "orders" | "clients" | "products" | "subscribers"; query: Prisma.PrismaPromise<unknown> }[] = [];
    if (wipeActivity) {
      // OrderItem est supprimé en cascade avec Order.
      steps.push({ key: "orders", query: prisma.order.deleteMany() });
      steps.push({ query: prisma.review.deleteMany() });
      steps.push({ query: prisma.wishlistItem.deleteMany() });
      steps.push({ query: prisma.cartItem.deleteMany() });
      steps.push({ query: prisma.cart.deleteMany() });
      steps.push({ query: prisma.abandonedCart.deleteMany() });
      steps.push({ query: prisma.restockRequest.deleteMany() });
      steps.push({ query: prisma.promoCode.updateMany({ data: { usedCount: 0 } }) });
    }
    if (wipeNewsletter) steps.push({ key: "subscribers", query: prisma.newsletterSubscriber.deleteMany() });
    if (zeroStock) steps.push({ query: prisma.productVariant.updateMany({ data: { stock: 0 } }) });
    if (wipeCatalogue) {
      // Images, variantes et guides des tailles partent en cascade.
      steps.push({ key: "products", query: prisma.product.deleteMany() });
      steps.push({ query: prisma.drop.deleteMany() });
      steps.push({ query: prisma.promoCode.deleteMany() });
    }
    if (wipeClients) steps.push({ key: "clients", query: prisma.user.deleteMany({ where: { role: "CLIENT" } }) });

    const results = await prisma.$transaction(steps.map((s) => s.query));
    const counts = { orders: 0, clients: 0, products: 0, subscribers: 0 };
    steps.forEach((s, i) => {
      if (s.key) counts[s.key] = (results[i] as { count: number }).count;
    });

    // Hors transaction et best-effort : comptes de connexion Supabase des
    // clients et fichiers médias des produits supprimés. Les données sont
    // déjà effacées à ce stade, donc rien ici ne doit faire échouer l'action.
    let authFailures = 0;
    if (clientAccounts.length > 0 || productIds.length > 0) {
      try {
        const supabase = createAdminClient();
        for (const { supabaseId } of clientAccounts) {
          const { error } = await supabase.auth.admin.deleteUser(supabaseId);
          if (error) authFailures++;
        }
        for (const id of productIds) {
          const { data: files } = await supabase.storage.from(MEDIA_BUCKET).list(id);
          if (files?.length) await supabase.storage.from(MEDIA_BUCKET).remove(files.map((f) => `${id}/${f.name}`));
        }
      } catch (error) {
        console.error("[admin] formatage connexions/médias:", error);
        authFailures = Math.max(authFailures, clientAccounts.length);
      }
    }

    revalidateTag("products");
    revalidateTag("categories");
    revalidatePath("/", "layout");

    const parts = [
      wipeActivity && `${counts.orders} commande(s) et toute l'activité`,
      wipeClients && `${counts.clients} compte(s) client`,
      wipeCatalogue && `${counts.products} produit(s), drops et codes promo`,
      wipeNewsletter && `${counts.subscribers} abonné(s) newsletter`,
      zeroStock && "stocks remis à 0",
    ].filter(Boolean);
    const warning = authFailures > 0 ? ` (${authFailures} connexion(s) client n'ont pas pu être supprimées côté Supabase)` : "";
    return `Formatage terminé : ${parts.join(", ")}.${warning}`;
  });
}
