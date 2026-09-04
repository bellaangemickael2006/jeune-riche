/**
 * Seed de DÉVELOPPEMENT uniquement — ne jamais exécuter automatiquement en production
 * (voir règle #90 du brief). Les 6 produits ci-dessous correspondent aux assets réels
 * inspectés dans C:\Users\Bella\Downloads\JEUNE RICHE\JEUNE RICHE — aucune donnée
 * commerciale (prix, stock) n'est inventée : le prix reste `null` ("à définir") et le
 * stock démarre à 0 jusqu'à saisie réelle en admin. Les produits sont créés en DRAFT,
 * non publiés : ils n'apparaissent pas dans le catalogue tant qu'un admin ne les publie
 * pas explicitement après avoir vérifié prix et stock.
 */
import { PrismaClient, ImageType } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "T-shirt", slug: "t-shirt" },
  { name: "Polo", slug: "polo" },
  { name: "Chemise", slug: "chemise" },
  { name: "Débardeur", slug: "debardeur" },
  { name: "Jogger", slug: "jogger" },
  { name: "Casquette", slug: "casquette" },
];

async function main() {
  console.log("Seed dev — catégories…");
  const categories = new Map<string, string>();
  for (const [i, cat] of CATEGORIES.entries()) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, sortOrder: i },
    });
    categories.set(cat.slug, created.id);
  }

  console.log("Seed dev — produits…");

  await upsertProduct({
    slug: "t-shirt-jeune-riche",
    name: "T-shirt Jeune Riche",
    categoryId: categories.get("t-shirt")!,
    description:
      "T-shirt col rond, visage-roi tribal brodé/imprimé. Disponible en noir, blanc et taupe.",
    personalizationEnabled: true,
    images: [
      { url: "/images/products/tshirt-noir/mockup-1.png", alt: "T-shirt noir — mockup", type: ImageType.MOCKUP },
      { url: "/images/products/tshirt-noir/mockup-6.png", alt: "T-shirt noir dos — mockup", type: ImageType.MOCKUP },
      { url: "/images/products/tshirt-blanc/front-1.jpg", alt: "T-shirt blanc — face", type: ImageType.FRONT },
      { url: "/images/products/tshirt-blanc/detail-neck-label.jpg", alt: "T-shirt blanc — détail étiquette col", type: ImageType.DETAIL },
      { url: "/images/products/tshirt-blanc/lifestyle-hanging.jpg", alt: "T-shirt blanc — sur portant", type: ImageType.LIFESTYLE },
      { url: "/images/products/tshirt-taupe/front-1.jpg", alt: "T-shirt taupe — face", type: ImageType.FRONT },
    ],
    variants: [
      { color: "Noir", size: "S" }, { color: "Noir", size: "M" }, { color: "Noir", size: "L" }, { color: "Noir", size: "XL" },
      { color: "Blanc", size: "S" }, { color: "Blanc", size: "M" }, { color: "Blanc", size: "L" }, { color: "Blanc", size: "XL" },
      { color: "Taupe", size: "M" }, { color: "Taupe", size: "L" },
    ],
  });

  await upsertProduct({
    slug: "polo-jeune-riche",
    name: "Polo Jeune Riche",
    categoryId: categories.get("polo")!,
    description: "Polo marine profond, broderie visage-roi et wordmark sur poitrine.",
    personalizationEnabled: false,
    images: [
      { url: "/images/products/polo-marine/mockup-front-back.jpg", alt: "Polo marine — face et dos", type: ImageType.MOCKUP },
    ],
    variants: [
      { color: "Marine", size: "S" }, { color: "Marine", size: "M" }, { color: "Marine", size: "L" }, { color: "Marine", size: "XL" },
    ],
  });

  await upsertProduct({
    slug: "chemise-jeune-riche",
    name: "Chemise Jeune Riche",
    categoryId: categories.get("chemise")!,
    description: "Chemise habillée blanche, manches longues, broderie visage-roi sur poitrine.",
    personalizationEnabled: false,
    images: [
      { url: "/images/products/chemise-blanche/mockup-front-back.jpg", alt: "Chemise blanche — face et dos", type: ImageType.MOCKUP },
    ],
    variants: [
      { color: "Blanche", size: "S" }, { color: "Blanche", size: "M" }, { color: "Blanche", size: "L" }, { color: "Blanche", size: "XL" },
    ],
  });

  await upsertProduct({
    slug: "debardeur-jeune-riche",
    name: "Débardeur Jeune Riche",
    categoryId: categories.get("debardeur")!,
    description: "Débardeur noir, wordmark et visage-roi sur poitrine.",
    personalizationEnabled: false,
    images: [
      { url: "/images/products/debardeur-noir/mockup-front-back.jpg", alt: "Débardeur noir — face et dos", type: ImageType.MOCKUP },
    ],
    variants: [
      { color: "Noir", size: "S" }, { color: "Noir", size: "M" }, { color: "Noir", size: "L" }, { color: "Noir", size: "XL" },
    ],
  });

  await upsertProduct({
    slug: "jogger-jeune-riche",
    name: "Jogger Jeune Riche",
    categoryId: categories.get("jogger")!,
    description: "Jogger gris, wordmark sur cuisse et visage-roi sur mollet.",
    personalizationEnabled: false,
    images: [
      { url: "/images/products/jogger-gris/mockup-front-back.jpg", alt: "Jogger gris — face et dos", type: ImageType.MOCKUP },
    ],
    variants: [
      { color: "Gris", size: "S" }, { color: "Gris", size: "M" }, { color: "Gris", size: "L" }, { color: "Gris", size: "XL" },
    ],
  });

  await upsertProduct({
    slug: "casquette-jeune-riche",
    name: "Casquette Jeune Riche",
    categoryId: categories.get("casquette")!,
    description: "Casquette blanche, broderie visage-roi et wordmark en façade.",
    personalizationEnabled: false,
    images: [
      { url: "/images/products/casquette-blanche/mockup-front-back.jpg", alt: "Casquette blanche — face et dos", type: ImageType.MOCKUP },
    ],
    variants: [{ color: "Blanche", size: "Taille unique" }],
  });

  console.log("Seed dev terminé.");
  console.log(
    "Rappel : les produits sont créés en DRAFT (non publiés). Un admin doit saisir un prix réel " +
      "et un stock réel avant de publier depuis /admin/produits."
  );
  console.log(
    "Rappel : aucun compte admin n'est seedé — un utilisateur doit s'inscrire via Supabase Auth, " +
      "puis être promu ADMIN manuellement (voir README.md)."
  );
}

async function upsertProduct(input: {
  slug: string;
  name: string;
  categoryId: string;
  description: string;
  personalizationEnabled: boolean;
  images: { url: string; alt: string; type: ImageType }[];
  variants: { color: string; size: string }[];
}) {
  const product = await prisma.product.upsert({
    where: { slug: input.slug },
    update: {},
    create: {
      slug: input.slug,
      name: input.name,
      categoryId: input.categoryId,
      description: input.description,
      personalizationEnabled: input.personalizationEnabled,
      price: null,
      status: "DRAFT",
      published: false,
    },
  });

  for (const [i, img] of input.images.entries()) {
    await prisma.productImage.upsert({
      where: { id: `${product.id}-img-${i}` },
      update: {},
      create: {
        id: `${product.id}-img-${i}`,
        productId: product.id,
        url: img.url,
        alt: img.alt,
        type: img.type,
        sortOrder: i,
        isPrimary: i === 0,
      },
    });
  }

  for (const v of input.variants) {
    const sku = `${product.slug}-${v.color}-${v.size}`.toUpperCase().replace(/\s+/g, "-");
    await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: { productId: product.id, color: v.color, size: v.size, stock: 0, sku },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
