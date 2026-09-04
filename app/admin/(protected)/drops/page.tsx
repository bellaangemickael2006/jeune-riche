import { prisma } from "@/lib/prisma";
import { createDrop } from "@/lib/actions/drops";

export default async function AdminDropsPage() {
  let drops: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    drops = await load();
  } catch {
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Drops</h1>

      {!available && (
        <p className="mt-4 border border-blood/40 bg-blood/10 px-4 py-3 text-xs text-blood">
          Base de données indisponible.
        </p>
      )}

      {available && (
        <ul className="mt-8 divide-y divide-line">
          {drops.length === 0 && <p className="py-4 text-sm text-paper/40">Aucun drop actuellement.</p>}
          {drops.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm text-paper">{d.name}</p>
                <p className="text-xs text-paper/40">
                  {d.startsAt.toLocaleDateString("fr-FR")} · {d.products.length} produit(s)
                </p>
              </div>
              <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
                {d.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={createDrop} className="mt-10 flex max-w-md flex-col gap-4 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest2 text-paper/50">Créer un drop</p>
        <input name="name" required placeholder="Nom" className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30" />
        <input name="startsAt" type="datetime-local" required className="border border-line bg-transparent px-4 py-3 text-sm text-paper" />
        <textarea name="description" rows={3} placeholder="Description" className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30" />
        <button className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">Créer</button>
      </form>
    </div>
  );
}

function load() {
  return prisma.drop.findMany({ include: { products: true }, orderBy: { startsAt: "asc" } });
}
