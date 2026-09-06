import { prisma } from "@/lib/prisma";

export default async function AdminClientsPage() {
  let clients: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    clients = await load();
  } catch {
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Clients</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && clients.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun client pour le moment.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Nom</th>
              <th className="py-2">Email</th>
              <th className="py-2">Commandes</th>
              <th className="py-2">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-line/50">
                <td className="py-2 text-paper">{c.name ?? "—"}</td>
                <td className="py-2 text-paper/60">{c.email}</td>
                <td className="py-2 text-paper/60">{c.orders.length}</td>
                <td className="py-2 text-paper/40">{c.createdAt.toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function load() {
  return prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { orders: true },
    orderBy: { createdAt: "desc" },
  });
}
