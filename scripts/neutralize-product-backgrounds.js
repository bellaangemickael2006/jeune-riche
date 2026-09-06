// Uniformise le fond des visuels catalogue : chaque mockup a un aplat de
// studio différent (rouge, blanc, marron), ce qui casse toute cohérence
// visuelle sur la grille catalogue. Les fonds sont des aplats parfaitement
// unis (vérifié : les 4 coins de chaque image sont identiques au pixel
// près) donc un simple chroma-key par distance colorimétrique suffit —
// pas besoin de segmentation ML. Le vêtement réel est détouré puis
// recomposé sur la teinte neutre déjà utilisée par le design system
// (`line`, #26252A) comme fond de vignette produit.
//
// Usage : node scripts/neutralize-product-backgrounds.js

const sharp = require("sharp");
const path = require("path");

// Gris clair neutre (façon studio A-COLD-WALL*) plutôt qu'un fond sombre :
// un fond sombre expose au grand jour les faux positifs du chroma-key sur
// les produits eux-mêmes clairs (ex. la casquette blanche), où les zones
// claires du vêtement sont proches de la couleur de fond détectée et se
// retrouvent donc transparentes — invisible sur un fond clair, visible en
// "trous" sur un fond sombre.
const TARGET_BG = { r: 225, g: 222, b: 216 };
const INNER_THRESHOLD = 18; // distance en dessous de laquelle un pixel est considéré fond
const OUTER_THRESHOLD = 55; // distance au-dessus de laquelle un pixel est considéré vêtement

const SOURCES = [
  "public/images/products/casquette-blanche/mockup-front-back.jpg",
  "public/images/products/chemise-blanche/mockup-front-back.jpg",
  "public/images/products/debardeur-noir/mockup-front-back.jpg",
  "public/images/products/jogger-gris/mockup-front-back.jpg",
  "public/images/products/polo-marine/mockup-front-back.jpg",
  "public/images/products/tshirt-noir/mockup-1.png",
  "public/images/products/tshirt-noir/mockup-6.png",
];

function distance(r, g, b, bg) {
  return Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
}

async function processOne(relPath) {
  const img = sharp(relPath);
  const meta = await img.metadata();
  const { data } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const w = meta.width,
    h = meta.height;

  // Couleur de fond = moyenne des 4 coins de l'image source.
  const corners = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
  ];
  let sr = 0,
    sg = 0,
    sb = 0;
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
  }
  const bg = { r: sr / 4, g: sg / 4, b: sb / 4 };

  const out = Buffer.from(data);
  for (let i = 0; i < data.length; i += 4) {
    const d = distance(data[i], data[i + 1], data[i + 2], bg);
    let alpha;
    if (d <= INNER_THRESHOLD) alpha = 0;
    else if (d >= OUTER_THRESHOLD) alpha = 255;
    else alpha = Math.round(((d - INNER_THRESHOLD) / (OUTER_THRESHOLD - INNER_THRESHOLD)) * 255);
    out[i + 3] = alpha;
  }

  const cutout = sharp(out, { raw: { width: w, height: h, channels: 4 } });

  const canvas = sharp({
    create: {
      width: w,
      height: h,
      channels: 3,
      background: TARGET_BG,
    },
  });

  const outPath = relPath.replace(/(\.[a-z]+)$/i, "-neutral.jpg");
  await canvas
    .composite([{ input: await cutout.png().toBuffer() }])
    .jpeg({ quality: 92 })
    .toFile(outPath);

  console.log(`${relPath} -> ${outPath} (fond source: rgb(${bg.r},${bg.g},${bg.b}))`);
  return outPath;
}

(async () => {
  for (const src of SOURCES) {
    await processOne(path.join(process.cwd(), src));
  }
})();
