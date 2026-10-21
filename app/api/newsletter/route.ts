import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, newsletterConfirmEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { subscribeConfirmUrl } from "@/lib/newsletter/confirm";
import { subscribe } from "@/lib/newsletter/subscribe";

// En minuscules : « Awa@Mail.com » et « awa@mail.com » sont le même abonné.
// `source` : « drop » quand l'inscription vient de « Me prévenir à l'ouverture ».
const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(["newsletter", "drop"]).optional(),
});

// Plafonds d'envoi : un formulaire public qui envoie des emails peut servir à
// bombarder une adresse, ou à épuiser le quota quotidien de Gmail (~500) au
// point de bloquer les emails de commande. Une confirmation par adresse et
// par jour, et un plafond global pour toutes les inscriptions.
const PER_ADDRESS_PER_DAY = 1;
const GLOBAL_PER_DAY = 150;
const DAY_MS = 24 * 60 * 60_000;

/**
 * Inscription en deux temps (lib/newsletter/confirm.ts) : on envoie un lien
 * de confirmation, personne n'est inscrit avant le clic. La réponse est la
 * même que l'adresse soit déjà inscrite ou non (rien à sonder).
 */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`newsletter:${clientIp(req)}`, 10, 15 * 60_000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json().catch(() => null)
    : await req
        .formData()
        .then((fd) => Object.fromEntries(fd.entries()))
        .catch(() => null);

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  const { email } = parsed.data;
  const source = parsed.data.source ?? "newsletter";

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    const confirmUrl = existing ? null : subscribeConfirmUrl(email, source);
    if (!existing && !confirmUrl) {
      // Aucune clé de signature configurée (développement) : inscription directe, comme avant.
      await subscribe(email, source);
    } else if (
      confirmUrl &&
      (await rateLimit(`newsletter-mail:${email}`, PER_ADDRESS_PER_DAY, DAY_MS)) &&
      (await rateLimit("newsletter-mail:global", GLOBAL_PER_DAY, DAY_MS))
    ) {
      await sendEmail({
        to: email,
        subject: "Confirmez votre inscription — JEUNE RICHE",
        html: newsletterConfirmEmail(confirmUrl),
      });
    }
  } catch (error) {
    console.error("[api/newsletter]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true, pending: true });
  }
  return NextResponse.redirect(new URL("/?newsletter=confirmer", req.url), 303);
}
