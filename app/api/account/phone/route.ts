import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { cleanPhone } from "@/lib/account/phone";

// Numéro WhatsApp du client connecté — demandé après une inscription Google
// (Google ne le fournit pas) et depuis le rappel de « Mon compte ».
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { phone?: unknown } | null;
  const phone = typeof body?.phone === "string" ? cleanPhone(body.phone) : null;
  if (!phone) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const updated = await prisma.user.updateMany({
    where: { supabaseId: authUser.id },
    data: { addressPhone: phone },
  });
  if (updated.count === 0) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
