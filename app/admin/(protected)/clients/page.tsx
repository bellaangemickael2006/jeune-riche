import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let clients: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    clients = await load(q);
  } catch {
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Clients</h1>

      <form className="mt-6 max-w-xs">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher un nom ou un email…"
          className="w-full border border-line bg-transparent px-4 py-2 text-sm text-paper placeholder:text-paper/30"
        />
      </form>

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
    where: {
      role: "CLIENT",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { orders: true },
    orderBy: { createdAt: "desc" },
  });
}
