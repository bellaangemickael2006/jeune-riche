import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email, source: "newsletter" },
    });
  } catch (error) {
    console.error("[api/newsletter]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/?newsletter=ok", req.url));
}
