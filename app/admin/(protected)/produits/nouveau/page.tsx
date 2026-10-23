import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/lib/actions/products";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";

export default async function NewProductPage() {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("produits");
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
        <p className="mt-6 border border-line p-4 text-sm text-paper/70">
          Aucune catégorie pour le moment.{" "}
          <Link href="/admin/categories" className="text-paper underline underline-offset-4">
            Créez d&apos;abord une catégorie
          </Link>{" "}
          avant d&apos;ajouter un produit.
        </p>
      ) : available ? (
        <ActionForm action={createProduct} className="mt-8 flex flex-col gap-4">
          <Field label="Nom" name="name" required />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Catégorie</span>
            <select
              name="categoryId"
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink">
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Prix (F CFA, laisser vide si à définir)" name="price" type="number" />
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Description</span>
            <textarea
              name="description"
              rows={4}
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-paper/70">
            <input type="checkbox" name="personalizationEnabled" className="h-4 w-4" />
            Personnalisation activée
          </label>
          <SubmitButton pendingLabel="Création…" className="mt-2 bg-paper py-3 text-xs uppercase tracking-widest2 text-ink">
            Créer le produit
          </SubmitButton>
        </ActionForm>
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
      <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        {...(type === "number" ? { min: 0, step: 1 } : {})}
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
      />
    </label>
  );
}
