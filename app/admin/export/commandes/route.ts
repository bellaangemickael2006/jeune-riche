import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ordersWhere } from "@/lib/admin/filters";
import { ORDER_STATUS_LABEL } from "@/lib/adminLabels";
import { csvFilename, toCsv } from "@/lib/csv";

// Export CSV des commandes (comptabilité, tableur), avec les mêmes filtres
// que la liste Admin → Commandes, plus une période facultative.
export async function GET(request: NextRequest) {
  await requireAdmin();
  const p = request.nextUrl.searchParams;
  const orders = await prisma.order.findMany({
    where: ordersWhere({
      q: p.get("q") ?? undefined,
      statut: p.get("statut") ?? undefined,
      du: p.get("du") ?? undefined,
      au: p.get("au") ?? undefined,
    }),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = orders.map((o) => {
    const a = (o.shippingAddress ?? {}) as { line1?: string; city?: string; postalCode?: string; country?: string; phone?: string };
    return [
      o.orderNumber,
      o.createdAt,
      ORDER_STATUS_LABEL[o.status] ?? o.status,
      o.customerName,
      o.customerEmail,
      a.phone,
      a.line1,
      a.city,
      a.postalCode,
      a.country,
      o.items
        .map((i) => `${i.productName} ${i.color}/${i.size} ×${i.quantity}${i.personalization ? ` « ${i.personalization} »` : ""}`)
        .join(" | "),
      o.items.reduce((sum, i) => sum + i.quantity, 0),
      Number(o.subtotal),
      o.discountCode,
      Number(o.discountAmount),
      Number(o.shippingCost),
      Number(o.total),
      o.trackingNumber,
    ];
  });

  const csv = toCsv(
    [
      "N° commande",
      "Date (UTC)",
      "Statut",
      "Client",
      "Email",
      "Téléphone",
      "Adresse",
      "Ville",
      "Code postal",
      "Pays",
      "Articles",
      "Quantité",
      "Sous-total (XOF)",
      "Code promo",
      "Remise (XOF)",
      "Livraison (XOF)",
      "Total (XOF)",
      "N° de suivi",
    ],
    rows
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("commandes")}"`,
      "Cache-Control": "no-store",
    },
  });
}
