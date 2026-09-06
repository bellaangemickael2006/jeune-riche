import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, newsletterWelcomeEmail } from "@/lib/email";

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
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: parsed.data.email },
    });

    if (!existing) {
      await prisma.newsletterSubscriber.create({
        data: { email: parsed.data.email, source: "newsletter" },
      });
      await sendEmail({
        to: parsed.data.email,
        subject: "Bienvenue chez JEUNE RICHE",
        html: newsletterWelcomeEmail(),
      });
    }
  } catch (error) {
    console.error("[api/newsletter]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }

  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/?newsletter=ok", req.url));
}
