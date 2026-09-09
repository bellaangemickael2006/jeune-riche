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

    if (error || !data.user || !data.properties?.action_link) {
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

    await sendEmail({
      to: email,
      subject: "Confirmez votre inscription — JEUNE RICHE",
      html: signupConfirmationEmail(data.properties.action_link, name),
    });
  } catch (err) {
    console.error("[api/account/signup]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
