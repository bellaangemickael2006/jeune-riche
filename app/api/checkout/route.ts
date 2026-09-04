import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lineSchema = z.object({
  variantId: z.string(),
  productName: z.string(),
  size: z.string(),
  color: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  personalization: z.string().nullable(),
});

const schema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  shippingAddress: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional(),
  }),
  lines: z.array(lineSchema).min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { customerName, customerEmail, shippingAddress, lines } = parsed.data;
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shippingCost = 0; // aucune grille tarifaire réelle fournie — à définir en admin
  const total = subtotal + shippingCost;
  const orderNumber = `JR-${Date.now().toString(36).toUpperCase()}`;

  try {
    // vérification du stock réel avant création
    for (const line of lines) {
      const variant = await prisma.productVariant.findUnique({ where: { id: line.variantId } });
      if (!variant || variant.stock < line.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${line.productName} (${line.size}/${line.color}).` },
          { status: 409 }
        );
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          customerEmail,
          shippingAddress,
          subtotal,
          shippingCost,
          total,
          items: {
            create: lines.map((l) => ({
              variantId: l.variantId,
              productName: l.productName,
              size: l.size,
              color: l.color,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              personalization: l.personalization,
            })),
          },
        },
      });

      for (const line of lines) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stock: { decrement: line.quantity } },
        });
      }

      return created;
    });

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("[api/checkout]", error);
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }
}
