import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";

export default async function AdminCategoriesPage() {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("produits");
  let categories: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    categories = await load();
  } catch (err) {
    console.error("[admin/categories]", err);
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Catégories</h1>
      <p className="mt-2 text-xs text-paper/40">
        Les catégories déterminent les filtres du catalogue et le menu déroulant lors de la création d&apos;un produit.
      </p>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && (
        <div className="mt-8 flex flex-col divide-y divide-line border-y border-line">
          {categories.length === 0 && <p className="py-4 text-sm text-paper/40">Aucune catégorie.</p>}
          {categories.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 py-5 md:flex-row md:items-start md:justify-between md:gap-6">
              <ActionForm
                action={updateCategory.bind(null, c.id)}
                className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1.6fr_0.6fr_auto]"
              >
                <input
                  name="name"
                  defaultValue={c.name}
                  required
                  className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
                />
                <input
                  name="description"
                  defaultValue={c.description ?? ""}
                  placeholder="Description (optionnelle)"
                  className="border border-line bg-transparent px-3 py-2 text-sm text-paper placeholder:text-paper/30"
                />
                <input
                  name="sortOrder"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={c.sortOrder}
                  aria-label="Ordre d'affichage"
                  className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
                />
                <SubmitButton className="border border-line px-4 py-2 text-[10px] uppercase tracking-widest2 text-paper/70 hover:border-paper hover:text-paper">
                  Enregistrer
                </SubmitButton>
              </ActionForm>
              <div className="flex shrink-0 items-center gap-4 md:pt-2">
                <span className="text-[10px] uppercase tracking-widest2 text-paper/30">
                  {c._count.products} produit{c._count.products > 1 ? "s" : ""} · /{c.slug}
                </span>
                <ActionForm action={deleteCategory.bind(null, c.id)}>
                  <ConfirmButton
                    confirmMessage={`Supprimer la catégorie "${c.name}" ?`}
                    disabled={c._count.products > 0}
                    className="text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
                    title={c._count.products > 0 ? "Réaffectez d'abord les produits de cette catégorie." : undefined}
                  >
                    Supprimer
                  </ConfirmButton>
                </ActionForm>
              </div>
            </div>
          ))}
        </div>
      )}

      <ActionForm action={createCategory} resetOnSuccess className="mt-10 flex max-w-md flex-col gap-4 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-widest2 text-paper/50">Nouvelle catégorie</p>
        <input
          name="name"
          required
          placeholder="Nom (ex. Sweat)"
          className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
        />
        <input
          name="description"
          placeholder="Description (optionnelle)"
          className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
        />
        <input
          name="sortOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={0}
          placeholder="Ordre d'affichage"
          aria-label="Ordre d'affichage"
          className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
        />
        <SubmitButton className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">Créer</SubmitButton>
      </ActionForm>
    </div>
  );
}

function load() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });
}
