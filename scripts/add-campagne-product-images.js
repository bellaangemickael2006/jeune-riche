// Rattache les nouvelles photos réelles au t-shirt en base, pour qu'elles
// apparaissent dans la galerie de la fiche produit. Idempotent : une image
// déjà présente (même URL) n'est jamais dupliquée.
//
// Les deux flat-lay montrent la personnalisation réellement imprimée
// ("AURA." et "BELLA") — c'est la meilleure preuve visuelle de l'option de
// personnalisation, qui n'était jusqu'ici illustrée que par des mockups.
// Les deux photos portées sont rattachées au coloris Blanc : c'est bien un
// t-shirt blanc sur les deux images.
require("dotenv").config({ path: ".env.local" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SLUG = "t-shirt-jeune-riche";

const IMAGES = [
  {
    url: "/images/campagne/porte-dos-ciel.jpg",
    type: "LIFESTYLE",
    alt: "Homme de dos portant le t-shirt JEUNE RICHE blanc, badge imprimé au dos",
    color: "Blanc",
    sortOrder: 20,
  },
  {
    url: "/images/campagne/porte-voiture.jpg",
    type: "LIFESTYLE",
    alt: "Homme portant le t-shirt JEUNE RICHE blanc, assis dans une voiture",
    color: "Blanc",
    sortOrder: 21,
  },
  {
    url: "/images/products/tshirt-blanc/personnalisation-aura.jpg",
    type: "DETAIL",
    alt: "T-shirt JEUNE RICHE blanc personnalisé « AURA. » à la poitrine",
    color: "Blanc",
    sortOrder: 22,
  },
  {
    url: "/images/products/tshirt-noir/personnalisation-bella.jpg",
    type: "DETAIL",
    alt: "T-shirt JEUNE RICHE noir personnalisé « BELLA » à la poitrine",
    color: "Noir",
    sortOrder: 22,
  },
];

(async () => {
  const product = await prisma.product.findUnique({
    where: { slug: SLUG },
    include: { images: true },
  });
  if (!product) {
    console.error(`Produit introuvable : ${SLUG}`);
    process.exit(1);
  }

  const existing = new Set(product.images.map((i) => i.url));
  let added = 0;

  for (const img of IMAGES) {
    if (existing.has(img.url)) {
      console.log("déjà présent  ", img.url);
      continue;
    }
    await prisma.productImage.create({ data: { ...img, productId: product.id } });
    console.log("ajouté        ", img.url, `(${img.type}, ${img.color})`);
    added++;
  }

  const total = await prisma.productImage.count({ where: { productId: product.id } });
  console.log(`\n${added} image(s) ajoutée(s) — ${total} au total sur ${product.name}.`);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
