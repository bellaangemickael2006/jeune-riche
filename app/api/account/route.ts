import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  supabaseId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
});

// Crée la fiche `User` (Prisma/Postgres) miroir d'un compte Supabase Auth
// fraîchement créé, avec le rôle CLIENT par défaut. Un admin est promu
// manuellement ensuite (voir TODO.md) — jamais via cette route publique.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    await prisma.user.upsert({
      where: { supabaseId: parsed.data.supabaseId },
      update: {},
      create: {
        supabaseId: parsed.data.supabaseId,
        email: parsed.data.email,
        name: parsed.data.name || null,
        role: "CLIENT",
      },
    });
  } catch (error) {
    console.error("[api/account]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
