import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  addressLine1: z.string().min(1),
  addressCity: z.string().min(1),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().min(1),
  addressPhone: z.string().optional(),
});

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { supabaseId: authUser.id } });
}

// Adresse enregistrée sur le compte, réutilisée pour préremplir le
// formulaire de livraison au prochain achat.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  return NextResponse.json({
    addressLine1: user.addressLine1,
    addressCity: user.addressCity,
    addressPostalCode: user.addressPostalCode,
    addressCountry: user.addressCountry,
    addressPhone: user.addressPhone,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Adresse invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      addressLine1: parsed.data.addressLine1,
      addressCity: parsed.data.addressCity,
      addressPostalCode: parsed.data.addressPostalCode || null,
      addressCountry: parsed.data.addressCountry,
      addressPhone: parsed.data.addressPhone || null,
    },
  });

  return NextResponse.json({ ok: true });
}
