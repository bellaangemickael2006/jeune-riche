import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { sendEmail, signupConfirmationEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

// Remplace supabase.auth.signUp() côté client : celui-ci déclenche l'envoi
// automatique de l'email de confirmation par Supabase lui-même (branding
// générique, expéditeur Supabase). En passant par l'API admin generateLink
// (qui ne notifie jamais toute seule), on garde la main sur l'email — envoyé
// via lib/email.ts avec le template et l'expéditeur JEUNE RICHE, exactement
// comme la réinitialisation de mot de passe (voir forgot-password/route.ts).
//
// On n'utilise PAS data.properties.action_link (lien direct vers l'endpoint
// /verify de Supabase) : les scanners de sécurité des messageries (Gmail
// Safe Browsing, Outlook Safe Links, filtres antispam d'entreprise) suivent
// automatiquement les liens des emails pour les analyser AVANT que le client
// ne clique, ce qui consomme le token à usage unique — le vrai clic tombe
// alors sur "lien invalide/expiré" (otp_expired) malgré un premier essai.
// hashed_token pointe vers NOTRE page (compte/confirmation), qui n'appelle
// verifyOtp() que côté client au montage : un simple GET par un scanner ne
// déclenche jamais ce code JS, donc le token reste valable pour le vrai clic.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!rateLimit(`signup:${clientIp(req)}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  const { email, password, name } = parsed.data;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: name ? { name } : undefined,
        redirectTo: `${req.nextUrl.origin}/compte/confirmation`,
      },
    });

    if (error || !data.user || !data.properties?.hashed_token) {
      const alreadyExists =
        error?.code === "email_exists" ||
        /already registered|already exists/i.test(error?.message ?? "");
      return NextResponse.json(
        { error: alreadyExists ? "Un compte existe déjà avec cet email." : "Impossible de créer le compte." },
        { status: alreadyExists ? 409 : 500 }
      );
    }

    await prisma.user.upsert({
      where: { supabaseId: data.user.id },
      update: {},
      create: {
        supabaseId: data.user.id,
        email,
        name: name || null,
        role: "CLIENT",
      },
    });

    const confirmationUrl = `${req.nextUrl.origin}/compte/confirmation?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=signup`;

    await sendEmail({
      to: email,
      subject: "Confirmez votre inscription — JEUNE RICHE",
      html: signupConfirmationEmail(confirmationUrl, name),
    });
  } catch (err) {
    console.error("[api/account/signup]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
