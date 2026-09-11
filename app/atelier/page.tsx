import type { Metadata } from "next";
import { getPublishedProducts } from "@/lib/data/products";
import AtelierStudio, { type AtelierPiece } from "@/components/atelier/AtelierStudio";
import { getServerTranslation } from "@/lib/i18n/server";
import { sanitizePersonalization } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: t("atelier.title"),
    description: t("atelier.intro"),
    alternates: { canonical: "/atelier" },
  };
}

// L'atelier : la personnalisation cesse d'être une option cochée en bas
// d'une fiche produit pour devenir une pièce du site à part entière. C'est
// le seul endroit du parcours où l'on entre par le nom et non par le
// vêtement.
export default async function AtelierPage({
  searchParams,
}: {
  searchParams: Promise<{ nom?: string }>;
}) {
  const { t } = await getServerTranslation();
  const { nom } = await searchParams;
  const products = await getPublishedProducts();

  const pieces: AtelierPiece[] = products
    .filter((p) => p.personalizationEnabled)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price ? Number(p.price) : null,
      personalizationMaxLen: p.personalizationMaxLen,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, color: i.color })),
      variants: p.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    }));

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] bg-ink px-5 pb-24 pt-28 md:px-10 md:pt-36">
      <div className="flex items-baseline justify-between gap-6 border-t border-line pt-4">
        <span className="text-label text-paper/30">{t("atelier.eyebrow")}</span>
      </div>
      <h1 className="mt-6 max-w-4xl font-editorial text-heading-lg leading-[0.98] text-paper md:mt-8 md:text-[4.5rem]">
        {t("atelier.title")}
      </h1>
      <p className="text-body mt-6 max-w-md text-paper/50">{t("atelier.intro")}</p>

      {/* ?nom=KOFI ouvre l'atelier avec le nom déjà composé sur la pièce :
          c'est ce qui rend une création partageable par lien, sur WhatsApp
          ou en story. Le nom est nettoyé côté serveur avant d'être rendu,
          exactement comme la saisie au clavier. */}
      <div className="mt-14 border-t border-line pt-12 md:mt-20">
        <AtelierStudio pieces={pieces} initialName={sanitizePersonalization(nom ?? "")} />
      </div>
    </div>
  );
}
