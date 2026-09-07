import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";
import { getStoreSettings } from "@/lib/data/settings";

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
    postalCode: z.string().optional(),
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

    // Toujours calculés côté serveur depuis les réglages admin — jamais
    // acceptés depuis le client, même logique de confiance que le prix.
    const settings = await getStoreSettings();
    const freeThreshold =
      settings?.freeShippingThreshold !== null && settings?.freeShippingThreshold !== undefined
        ? Number(settings.freeShippingThreshold)
        : null;
    const shippingCost =
      freeThreshold !== null && subtotal >= freeThreshold ? 0 : Number(settings?.shippingCost ?? 0);

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

    // L'email ne doit jamais faire échouer la commande si l'envoi rate.
    sendEmail({
      to: customerEmail,
      subject: `Commande ${order.orderNumber} — JEUNE RICHE`,
      html: orderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName,
        items: resolvedLines,
        total,
      }),
    }).catch((error) => console.error("[api/checkout] email confirmation:", error));

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  } catch (error) {
    console.error("[api/checkout]", error);
    return NextResponse.json({ error: "Impossible de créer la commande." }, { status: 500 });
  }
}
