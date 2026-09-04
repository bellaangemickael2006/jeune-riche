import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  variantId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    await prisma.restockRequest.create({
      data: { variantId: parsed.data.variantId, email: parsed.data.email },
    });
  } catch (error) {
    console.error("[api/restock]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
