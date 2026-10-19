import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientsWhere } from "@/lib/admin/filters";
import { csvFilename, toCsv } from "@/lib/csv";

// Export CSV des clients avec leurs totaux, mêmes filtres que la liste
// Admin → Clients. Les commandes annulées ne comptent pas dans le total.
export async function GET(request: NextRequest) {
  await requireAdmin("clients");
  const clients = await prisma.user.findMany({
    where: clientsWhere({ q: request.nextUrl.searchParams.get("q") ?? undefined }),
    include: { orders: { select: { status: true, total: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = clients.map((c) => {
    const paid = c.orders.filter((o) => o.status !== "ANNULEE");
    const last = c.orders.reduce<Date | null>((max, o) => (!max || o.createdAt > max ? o.createdAt : max), null);
    return [
      c.name,
      c.email,
      c.addressPhone,
      c.addressLine1,
      c.addressCity,
      c.addressCountry,
      c.createdAt,
      paid.length,
      paid.reduce((sum, o) => sum + Number(o.total), 0),
      last,
    ];
  });

  const csv = toCsv(
    [
      "Nom",
      "Email",
      "Téléphone",
      "Adresse",
      "Ville",
      "Pays",
      "Inscrit le (UTC)",
      "Commandes (hors annulées)",
      "Total dépensé (XOF)",
      "Dernière commande (UTC)",
    ],
    rows
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("clients")}"`,
      "Cache-Control": "no-store",
    },
  });
}
