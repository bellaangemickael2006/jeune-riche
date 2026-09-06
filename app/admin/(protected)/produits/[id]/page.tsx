import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import {
  updateProduct,
  addVariant,
  deleteVariant,
  deleteProductImage,
  deleteProduct,
} from "@/lib/actions/products";
import { ImageUploadForm, VideoUploadForm } from "@/components/admin/MediaUploadForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true, images: { orderBy: { sortOrder: "asc" } }, category: true },
  });
  if (!product) notFound();

  const updateProductWithId = updateProduct.bind(null, product.id);
  const addVariantWithId = addVariant.bind(null, product.id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase text-paper">{product.name}</h1>
        <form action={async () => { "use server"; await deleteProduct(product.id); }}>
          <button className="text-xs uppercase tracking-widest2 text-blood/70 hover:text-blood">
            Supprimer
          </button>
        </form>
      </div>
      <p className="mt-1 text-xs text-paper/40">{product.category.name} · /{product.slug}</p>

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Informations</h2>
        <form action={updateProductWithId} className="mt-4 flex flex-col gap-4">
          <input
            name="name"
            defaultValue={product.name}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
          />
          <input
            name="price"
            type="number"
            defaultValue={product.price ? Number(product.price) : ""}
            placeholder="Prix (laisser vide si à définir)"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
          />
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            rows={3}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-paper/70">
            <input type="checkbox" name="personalizationEnabled" defaultChecked={product.personalizationEnabled} />
            Personnalisation activée
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">
              Longueur max. personnalisation
            </span>
            <input
              name="personalizationMaxLen"
              type="number"
              defaultValue={product.personalizationMaxLen}
              className="w-32 border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-paper/70">
            <input type="checkbox" name="published" defaultChecked={product.published} />
            Publié (visible dans le catalogue)
          </label>
          <button type="submit" className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Variantes (taille / couleur / stock)</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Couleur</th>
              <th className="py-2">Taille</th>
              <th className="py-2">SKU</th>
              <th className="py-2">Stock</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {product.variants.map((v) => (
              <tr key={v.id} className="border-b border-line/50">
                <td className="py-2 text-paper">{v.color}</td>
                <td className="py-2 text-paper">{v.size}</td>
                <td className="py-2 text-paper/40">{v.sku}</td>
                <td className="py-2">
                  <form action={async (fd: FormData) => {
                    "use server";
                    const { updateVariantStock } = await import("@/lib/actions/products");
                    await updateVariantStock(v.id, product.id, Number(fd.get("stock")));
                  }} className="flex items-center gap-2">
                    <input
                      name="stock"
                      type="number"
                      defaultValue={v.stock}
                      className="w-20 border border-line bg-transparent px-2 py-1 text-paper"
                    />
                    <button className="text-xs uppercase tracking-widest2 text-paper/40 hover:text-paper">
                      Mettre à jour
                    </button>
                  </form>
                </td>
                <td className="py-2">
                  <form action={async () => { "use server"; await deleteVariant(v.id, product.id); }}>
                    <button className="text-xs text-blood/70 hover:text-blood">Retirer</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form action={addVariantWithId} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">Couleur</span>
            <input name="color" required className="w-32 border border-line bg-transparent px-3 py-2 text-sm text-paper" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">Taille</span>
            <input name="size" required className="w-20 border border-line bg-transparent px-3 py-2 text-sm text-paper" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">Stock</span>
            <input name="stock" type="number" defaultValue={0} className="w-24 border border-line bg-transparent px-3 py-2 text-sm text-paper" />
          </label>
          <button className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper">
            Ajouter la variante
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Images</h2>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {product.images.map((img) => (
            <div key={img.id} className="relative aspect-square overflow-hidden border border-line">
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="150px" />
              <span className="absolute left-1 top-1 bg-ink/80 px-1.5 py-0.5 text-[9px] uppercase text-paper/70">
                {img.type}
              </span>
              <form
                action={async () => { "use server"; await deleteProductImage(img.id, product.id); }}
                className="absolute bottom-1 right-1"
              >
                <button className="bg-ink/80 px-1.5 py-0.5 text-[9px] uppercase text-blood">×</button>
              </form>
            </div>
          ))}
        </div>

        <ImageUploadForm productId={product.id} />
        <p className="mt-2 text-[11px] text-paper/30">
          Le fichier est envoyé vers Supabase Storage ; l&apos;aperçu ci-dessus montre le rendu réel
          avant confirmation.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Vidéo de présentation</h2>
        <VideoUploadForm productId={product.id} currentVideoUrl={product.videoUrl} />
      </section>
    </div>
  );
}
