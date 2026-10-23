import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  updateProduct,
  addVariant,
  updateVariantStock,
  deleteVariant,
  deleteProductImage,
  deleteProduct,
  deleteProductModel,
} from "@/lib/actions/products";
import { ImageUploadForm, ModelUploadForm, VideoUploadForm } from "@/components/admin/MediaUploadForm";
import { getProductModels } from "@/lib/data/productModels";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("produits");
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: [{ color: "asc" }, { size: "asc" }] }, images: { orderBy: { sortOrder: "asc" } }, category: true },
  });
  if (!product) notFound();
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const models = await getProductModels(product.id);
  const colors = Array.from(new Set(product.variants.map((v) => v.color)));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/produits" className="text-xs uppercase tracking-widest2 text-paper/60 hover:text-paper">
        ← Produits
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase text-paper">{product.name}</h1>
        <ActionForm action={deleteProduct.bind(null, product.id)} className="flex flex-col items-end gap-2">
          <ConfirmButton
            confirmMessage={`Supprimer définitivement "${product.name}" ? Cette action est irréversible.`}
            className="text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper"
          >
            Supprimer
          </ConfirmButton>
        </ActionForm>
      </div>
      <p className="mt-1 text-xs text-paper/60">
        {product.category.name} · /{product.slug}
        {product.published && (
          <>
            {" · "}
            <Link href={`/catalogue/${product.slug}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-paper">
              Voir sur le site
            </Link>
          </>
        )}
      </p>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Informations</h2>
        <ActionForm action={updateProduct.bind(null, product.id)} className="mt-4 flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Nom</span>
            <input
              name="name"
              required
              defaultValue={product.name}
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Catégorie</span>
            <select
              name="categoryId"
              defaultValue={product.categoryId}
              className="w-full border border-line bg-ink px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink">
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Prix (F CFA)</span>
            <input
              name="price"
              type="number"
              min={0}
              step={1}
              defaultValue={product.price !== null ? Number(product.price) : ""}
              placeholder="Laisser vide si à définir"
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-hidden"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Description</span>
            <textarea
              name="description"
              defaultValue={product.description ?? ""}
              rows={3}
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-paper/70">
            <input type="checkbox" name="personalizationEnabled" defaultChecked={product.personalizationEnabled} />
            Personnalisation activée
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">
              Longueur max. personnalisation
            </span>
            <input
              name="personalizationMaxLen"
              type="number"
              min={1}
              max={60}
              defaultValue={product.personalizationMaxLen}
              className="w-32 border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-paper/70">
            <input type="checkbox" name="published" defaultChecked={product.published} />
            Publié (visible dans le catalogue)
          </label>
          <SubmitButton
            pendingLabel="Enregistrement…"
            className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink"
          >
            Enregistrer
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Variantes (taille / couleur / stock)</h2>
          <Link
            href={`/admin/produits/${product.id}/stock`}
            className="border border-paper px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
          >
            Modifier tout le stock · historique
          </Link>
        </div>
        {/* overflow-x-auto : la table ne tient pas sur un écran mobile — le
            scroll horizontal la garde intacte plutôt que de la réécrire en
            cartes, elle reste un outil interne. */}
        <div className="mt-4 overflow-x-auto">
          {product.variants.length === 0 ? (
            <p className="text-sm text-paper/60">Aucune variante : ajoutez au moins une taille/couleur pour vendre ce produit.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-widest2 text-paper/60">
                  <th className="py-2">Couleur</th>
                  <th className="py-2">Taille</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {product.variants.map((v) => (
                  <tr key={v.id} className="border-b border-line/50 align-top">
                    <td className="py-2 text-paper">{v.color}</td>
                    <td className="py-2 text-paper">{v.size}</td>
                    <td className="py-2 text-paper/60">{v.sku}</td>
                    <td className="py-2">
                      <ActionForm
                        action={updateVariantStock.bind(null, v.id, product.id)}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          name="stock"
                          type="number"
                          min={0}
                          step={1}
                          required
                          defaultValue={v.stock}
                          className="w-20 border border-line bg-transparent px-2 py-1 text-paper"
                        />
                        <SubmitButton className="text-xs uppercase tracking-widest2 text-paper/60 hover:text-paper">
                          Mettre à jour
                        </SubmitButton>
                      </ActionForm>
                    </td>
                    <td className="py-2">
                      <ActionForm action={deleteVariant.bind(null, v.id, product.id)} className="flex flex-col gap-1">
                        <ConfirmButton
                          confirmMessage={`Retirer la variante ${v.color}/${v.size} ?`}
                          className="text-xs text-paper/60 underline underline-offset-4 hover:text-paper"
                        >
                          Retirer
                        </ConfirmButton>
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <ActionForm action={addVariant.bind(null, product.id)} resetOnSuccess className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Couleur</span>
            <input name="color" required className="w-32 border border-line bg-transparent px-3 py-2 text-sm text-paper" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Taille</span>
            <input name="size" required className="w-20 border border-line bg-transparent px-3 py-2 text-sm text-paper" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Stock</span>
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
              className="w-24 border border-line bg-transparent px-3 py-2 text-sm text-paper"
            />
          </label>
          <SubmitButton className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper">
            Ajouter la variante
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Images</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {product.images.map((img) => (
            <div key={img.id} className="relative aspect-square overflow-hidden border border-line">
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="150px" />
              <span className="absolute left-1 top-1 bg-ink/80 px-1.5 py-0.5 text-[11px] uppercase text-paper/70">
                {img.isPrimary ? `${img.type} · principale` : img.type}
              </span>
              {img.color && (
                <span className="absolute bottom-7 left-1 bg-ink/80 px-1.5 py-0.5 text-[11px] uppercase text-paper/70">
                  {img.color}
                </span>
              )}
              <ActionForm action={deleteProductImage.bind(null, img.id, product.id)} className="absolute bottom-1 right-1">
                <ConfirmButton
                  confirmMessage="Supprimer cette image ?"
                  aria-label="Supprimer cette image"
                  className="bg-ink/80 px-1.5 py-0.5 text-[11px] uppercase text-paper"
                >
                  ×
                </ConfirmButton>
              </ActionForm>
            </div>
          ))}
        </div>

        <ImageUploadForm
          productId={product.id}
          colors={colors}
        />
        <p className="mt-2 text-[11px] text-paper/60">
          Le fichier est envoyé vers Supabase Storage ; l&apos;aperçu ci-dessus montre le rendu réel
          avant confirmation.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Vidéo de présentation</h2>
        <VideoUploadForm productId={product.id} currentVideoUrl={product.videoUrl} />
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Modèle 3D — vue 360° (VirtualThreads)</h2>
        <p className="mt-2 max-w-xl text-[11px] leading-relaxed text-paper/60">
          Sur virtualthreads.io, placez votre design sur le T-shirt, choisissez la couleur, puis exportez le
          modèle 3D au format .glb (offre Pro). Envoyez un fichier par couleur : il remplace l&apos;ancien de la
          même couleur. L&apos;onglet « 3D 360° » apparaît sur la fiche dès qu&apos;un modèle existe pour la
          couleur choisie par le client.
        </p>
        {models.length > 0 && (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {models.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-paper">{m.color ?? "Toutes couleurs"}</span>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-paper/70 underline underline-offset-4 hover:text-paper"
                >
                  Fichier .glb
                </a>
                <ActionForm action={deleteProductModel.bind(null, m.id, product.id)}>
                  <ConfirmButton
                    confirmMessage="Supprimer ce modèle 3D ?"
                    className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper"
                  >
                    Supprimer
                  </ConfirmButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
        <ModelUploadForm productId={product.id} colors={colors} />
      </section>
    </div>
  );
}
