import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, newsletterWelcomeEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// En minuscules : « Awa@Mail.com » et « awa@mail.com » sont le même abonné.
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

export async function POST(req: NextRequest) {
  if (!rateLimit(`newsletter:${clientIp(req)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json().catch(() => null)
    : await req
        .formData()
        .then((fd) => Object.fromEntries(fd.entries()))
        .catch(() => null);

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
