import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({ email: z.string().email() });

// Génère le lien de récupération via l'API admin Supabase mais l'envoie
// nous-mêmes via lib/email.ts (même Gmail SMTP que la newsletter et les
// confirmations de commande) plutôt que de laisser Supabase envoyer son
// propre email par défaut, non brandé JEUNE RICHE.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  // Réponse identique (ok:true) qu'on soit rate-limité ou non : sinon la
  // différence de comportement deviendrait elle-même un moyen de sonder le
  // système, à l'opposé de la protection anti-énumération ci-dessous.
  // Par adresse aussi (3 par heure) : sinon, en changeant d'IP, on pouvait
  // bombarder une même boîte de liens de réinitialisation.
  if (
    !(await rateLimit(`forgot-password:${clientIp(req)}`, 5, 15 * 60_000)) ||
    !(await rateLimit(`forgot-password-mail:${parsed.data.email.trim().toLowerCase()}`, 3, 60 * 60_000))
  ) {
    return NextResponse.json({ ok: true });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: parsed.data.email,
      options: { redirectTo: `${req.nextUrl.origin}/compte/reinitialiser` },
    });

    // Ne jamais laisser deviner si l'email existe : on envoie seulement si
    // le compte existe réellement, mais la réponse HTTP est identique dans
    // les deux cas.
    if (!error && data.properties?.action_link) {
      await sendEmail({
        to: parsed.data.email,
        subject: "Réinitialisez votre mot de passe — JEUNE RICHE",
        html: passwordResetEmail(data.properties.action_link),
      });
    }
  } catch (err) {
    console.error("[api/account/forgot-password]", err);
  }

  return NextResponse.json({ ok: true });
}
