import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({
  variantId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(`restock:${clientIp(req)}`, 15, 15 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

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
