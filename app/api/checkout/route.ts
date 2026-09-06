import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const lineSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
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
  const shippingCost = 0; // aucune grille tarifaire réelle fournie — à définir en admin
  const orderNumber = `JR-${Date.now().toString(36).toUpperCase()}`;

  try {
    // Le prix envoyé par le navigateur n'est jamais fiable : on ne fait
    // confiance qu'à variantId + quantity, et on relit prix/stock/nom en base.
    const resolvedLines: {
      variantId: string;
      productName: string;
      size: string;
      color: string;
      quantity: number;
      unitPrice: number;
      personalization: string | null;
    }[] = [];
    for (const line of lines) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: line.variantId },
        include: { product: true },
      });

      if (!variant || !variant.product.published || variant.product.price === null) {
        return NextResponse.json(
          { error: "Un des articles du panier n'est plus disponible à la commande." },
          { status: 409 }
        );
      }
      if (variant.stock < line.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour ${variant.product.name} (${variant.size}/${variant.color}).` },
          { status: 409 }
        );
      }

      resolvedLines.push({
        variantId: variant.id,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        quantity: line.quantity,
        unitPrice: Number(variant.product.price),
        personalization: line.personalization,
      });
    }

    const subtotal = resolvedLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const total = subtotal + shippingCost;

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
          items: { create: resolvedLines },
        },
      });

      for (const line of resolvedLines) {
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
