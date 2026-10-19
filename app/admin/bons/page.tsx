import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ordersWhere } from "@/lib/admin/filters";
import OrderSlip from "@/components/admin/OrderSlip";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const MAX_SLIPS = 100;

// Bons de commande à imprimer, une page A4 par commande. Hors du layout de
// l'admin (pas de menu latéral) pour une impression propre.
// - ?ids=a,b,c : ces commandes-là ;
// - sinon les filtres de la liste (q, statut, du, au), comme l'export CSV.
export default async function OrderSlipsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; q?: string; statut?: string; du?: string; au?: string; imprimer?: string }>;
}) {
  await requireAdmin("commandes");
  const params = await searchParams;
  const ids = params.ids
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SLIPS);

  const orders = await prisma.order.findMany({
    where: ids?.length ? { id: { in: ids } } : ordersWhere(params),
    include: { items: true },
    // Ordre de traitement à l'atelier : les plus anciennes d'abord.
    orderBy: { createdAt: "asc" },
    take: MAX_SLIPS,
  });

  return (
    <div className="min-h-screen bg-neutral-800 px-4 py-8 print:bg-white print:p-0">
      {/* Fond blanc et marges A4 à l'impression, quel que soit le thème du site. */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .slip + .slip { break-before: page; }
        }
      `}</style>

      <div className="mx-auto mb-8 flex max-w-[190mm] flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="text-white">
          <Link href="/admin/commandes" className="text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white">
            ← Commandes
          </Link>
          <p className="mt-2 text-sm">
            {orders.length === 0
              ? "Aucune commande à imprimer."
              : `${orders.length} bon${orders.length > 1 ? "s" : ""} de commande — un par page.`}
            {orders.length === MAX_SLIPS && " (limité aux 100 premiers : affinez le filtre)"}
          </p>
        </div>
        {orders.length > 0 && <PrintButton label="Imprimer" auto={params.imprimer === "1"} />}
      </div>

      {orders.map((order) => (
        <OrderSlip key={order.id} order={order} />
      ))}
    </div>
  );
}
