import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { clientsWhere } from "@/lib/admin/filters";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin();
  const { q } = await searchParams;
  let clients: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    clients = await load(q);
  } catch (err) {
    console.error("[admin/clients]", err);
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Clients</h1>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <form className="w-full max-w-xs">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher un nom ou un email…"
            className="w-full border border-line bg-transparent px-4 py-2 text-sm text-paper placeholder:text-paper/30"
          />
        </form>
        <a
          href={`/admin/export/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className="border border-paper px-4 py-2 text-[10px] uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          Exporter en CSV
        </a>
      </div>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && clients.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun client trouvé.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Nom</th>
              <th className="py-2">Email</th>
              <th className="py-2">Commandes</th>
              <th className="py-2">Total dépensé</th>
              <th className="py-2">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const spent = c.orders
                .filter((o) => o.status !== "ANNULEE")
                .reduce((sum, o) => sum + Number(o.total), 0);
              return (
                <tr key={c.id} className="border-b border-line/50">
                  <td className="py-2">
                    <Link href={`/admin/clients/${c.id}`} className="text-paper hover:underline">
                      {c.name ?? "—"}
                    </Link>
                  </td>
                  <td className="py-2 text-paper/60">{c.email}</td>
                  <td className="py-2 text-paper/60">{c.orders.length}</td>
                  <td className="py-2 text-paper/60">{formatPrice(spent)}</td>
                  <td className="py-2 text-paper/40">{c.createdAt.toLocaleDateString("fr-FR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

function load(q?: string) {
  return prisma.user.findMany({
    where: clientsWhere({ q }),
    include: { orders: true },
    orderBy: { createdAt: "desc" },
  });
}
