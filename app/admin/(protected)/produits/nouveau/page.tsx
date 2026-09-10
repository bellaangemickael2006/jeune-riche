import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/actions/products";

export default async function NewProductPage() {
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let available = true;
  try {
    categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  } catch (err) {
    console.error("[admin/produits/nouveau]", err);
    available = false;
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl uppercase text-paper">Nouveau produit</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && categories.length === 0 ? (
        <p className="mt-6 border border-line p-4 text-sm text-paper/50">
          Aucune catégorie en base. Exécutez le seed de développement (
          <code className="text-paper/70">npm run seed</code>) ou créez les catégories directement
          en base avant de créer un produit.
        </p>
      ) : available ? (
        <form action={createProduct} className="mt-8 flex flex-col gap-4">
          <Field label="Nom" name="name" required />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Catégorie</span>
            <select
              name="categoryId"
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink">
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Prix (FCFA, laisser vide si à définir)" name="price" type="number" />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Description</span>
            <textarea
              name="description"
              rows={4}
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-paper/70">
            <input type="checkbox" name="personalizationEnabled" className="h-4 w-4" />
            Personnalisation activée
          </label>
          <button type="submit" className="mt-2 bg-paper py-3 text-xs uppercase tracking-widest2 text-ink">
            Créer le produit
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
      />
    </label>
  );
}
