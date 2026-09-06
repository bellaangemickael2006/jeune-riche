// Uniformise le fond des visuels catalogue : chaque mockup a un aplat de
// studio différent (rouge, blanc, marron), ce qui casse toute cohérence
// visuelle sur la grille catalogue. Les fonds sont des aplats parfaitement
// unis (vérifié : les 4 coins de chaque image sont identiques au pixel
// près) mais une classification pixel par pixel par simple distance
// colorimétrique échoue dès qu'une ombre interne a une teinte proche du
// fond (plis marron sur fond marron) : ces zones se retrouvent classées
// "fond" et deviennent des trous une fois recomposées. On utilise donc un
// flood-fill à partir des bords de l'image : seuls les pixels couleur-fond
// RÉELLEMENT connectés à la bordure (à un seuil de tolérance serré) sont
// retirés, ce qui laisse intactes les ombres internes même proches en
// teinte. Le vêtement réel est ensuite recomposé sur la teinte neutre du
// design system (`studio`, #E1DED8).
//
// Usage : node scripts/neutralize-product-backgrounds.js

const sharp = require("sharp");
const path = require("path");

const TARGET_BG = { r: 225, g: 222, b: 216 };
const BG_THRESHOLD = 16; // tolérance serrée : un seuil large fait fuir le flood-fill dans les ombres internes proches du fond
const FEATHER = 2; // largeur (px) de l'adoucissement de bord

const SOURCES = [
  "public/images/products/casquette-blanche/mockup-front-back.jpg",
  "public/images/products/chemise-blanche/mockup-front-back.jpg",
  "public/images/products/debardeur-noir/mockup-front-back.jpg",
  "public/images/products/jogger-gris/mockup-front-back.jpg",
  "public/images/products/polo-marine/mockup-front-back.jpg",
  "public/images/products/tshirt-noir/mockup-1.png",
  "public/images/products/tshirt-noir/mockup-6.png",
  "public/images/products/tshirt-blanc/front-1.jpg",
  // tshirt-taupe/front-1.jpg exclu : l'ombre portée sur ce rendu descend
  // jusqu'à la couleur de fond EXACTE (distance 0 mesurée) sur une zone
  // large et connectée au bord — aucun seuil de tolérance ne peut séparer
  // ombre et fond ici sans un vrai matting ML. Laissé sur son fond marron
  // d'origine en attendant une vraie photo ou un détourage manuel.
];

function distance(r, g, b, bg) {
  return Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
}

// Flood-fill 4-connexe depuis tous les pixels de bordure : marque comme
// "fond" uniquement les pixels couleur-fond atteignables depuis l'extérieur
// sans traverser de pixel vêtement. Une ombre interne couleur-fond mais
// entourée de tissu reste donc opaque.
function floodFillBackground(isBgColor, w, h) {
  const isBg = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;

  function tryPush(x, y) {
    const p = y * w + x;
    if (isBg[p] || !isBgColor[p]) return;
    isBg[p] = 1;
    stack[sp++] = p;
  }

  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  while (sp > 0) {
    const p = stack[--sp];
    const x = p % w,
      y = (p / w) | 0;
    if (x > 0) tryPush(x - 1, y);
    if (x < w - 1) tryPush(x + 1, y);
    if (y > 0) tryPush(x, y - 1);
    if (y < h - 1) tryPush(x, y + 1);
  }

  return isBg;
}

async function processOne(relPath) {
  const img = sharp(relPath);
  const meta = await img.metadata();
  const { data } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const w = meta.width,
    h = meta.height;

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

  const isBgColor = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    isBgColor[p] = distance(data[i], data[i + 1], data[i + 2], bg) <= BG_THRESHOLD ? 1 : 0;
  }
  const isBg = floodFillBackground(isBgColor, w, h);

  // Distance (en pixels) de chaque pixel FOND au vêtement le plus proche,
  // pour adoucir la lisière sur FEATHER pixels plutôt que de laisser un
  // bord parfaitement dur. Un pixel vêtement lui-même reste toujours à
  // dist=0 et donc toujours pleinement opaque (voir boucle d'alpha ci-après).
  const dist = new Uint8Array(w * h).fill(255);
  const queue = new Int32Array(w * h);
  let qh = 0,
    qt = 0;
  for (let p = 0; p < w * h; p++) {
    if (!isBg[p]) {
      dist[p] = 0;
      queue[qt++] = p;
    }
  }
  while (qh < qt) {
    const p = queue[qh++];
    const d = dist[p];
    if (d >= FEATHER) continue;
    const x = p % w,
      y = (p / w) | 0;
    const neighbors = [];
    if (x > 0) neighbors.push(p - 1);
    if (x < w - 1) neighbors.push(p + 1);
    if (y > 0) neighbors.push(p - w);
    if (y < h - 1) neighbors.push(p + w);
    for (const np of neighbors) {
      if (dist[np] > d + 1) {
        dist[np] = d + 1;
        queue[qt++] = np;
      }
    }
  }

  // Un fond très saturé (rouge, sarcelle) laisse une contamination de
  // teinte sur le vêtement qui déborde largement au-delà d'une mince
  // frange d'antialiasing : le sous-échantillonnage chroma du JPEG source
  // étale la couleur du fond sur une zone de largeur irrégulière, plus
  // large aux recoins concaves (aisselle/manche) qu'ailleurs — une bande
  // de largeur fixe autour du contour ne suffit donc pas à la couvrir. On
  // détecte plutôt la contamination par sa TEINTE : un pixel dont l'excès
  // de couleur (par rapport au gris) pointe dans la même direction que la
  // couleur du fond est par définition contaminé, où qu'il soit dans
  // l'image, puisque le vêtement réel ici est achromatique (blanc/noir/
  // gris). Restreint aux fonds nettement saturés pour ne jamais toucher un
  // vêtement dont la vraie couleur est saturée (ex. le polo marine sur
  // fond blanc, dont la teinte ne correspond de toute façon pas à celle
  // d'un fond neutre).
  const bgSaturation = Math.max(bg.r, bg.g, bg.b) - Math.min(bg.r, bg.g, bg.b);
  const desaturateEdges = bgSaturation > 60;
  const bgMean = (bg.r + bg.g + bg.b) / 3;
  const bgUnit = desaturateEdges
    ? (() => {
        const dr = bg.r - bgMean,
          dg = bg.g - bgMean,
          db = bg.b - bgMean;
        const len = Math.sqrt(dr * dr + dg * dg + db * db) || 1;
        return { r: dr / len, g: dg / len, b: db / len };
      })()
    : null;

  const out = Buffer.from(data);
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    let alpha;
    if (!isBg[p]) alpha = 255;
    else if (dist[p] < FEATHER) alpha = Math.round((1 - dist[p] / FEATHER) * 255);
    else alpha = 0;
    out[i + 3] = alpha;

    // Un pixel fond dans la zone d'adoucissement (alpha partiel) garde par
    // défaut sa PROPRE couleur source (souvent encore teintée près du vrai
    // contour, à cause du sous-échantillonnage chroma JPEG) — mélangée à
    // alpha réduit avec le canevas, elle reste visible en frange colorée.
    // On la remplace par la couleur cible exacte : à n'importe quel alpha,
    // "couleur cible" mélangée à "couleur cible" reste "couleur cible",
    // donc plus aucune frange possible côté fond.
    if (isBg[p]) {
      out[i] = TARGET_BG.r;
      out[i + 1] = TARGET_BG.g;
      out[i + 2] = TARGET_BG.b;
    }

    if (desaturateEdges && !isBg[p]) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const mean = (r + g + b) / 3;
      const dr = r - mean,
        dg = g - mean,
        db = b - mean;
      const chroma = Math.sqrt(dr * dr + dg * dg + db * db);
      if (chroma > 4) {
        // Alignement (cosinus) entre l'excès de couleur de ce pixel et la
        // direction de teinte du fond : proche de 1 = même teinte que le
        // fond (contamination), proche de 0 ou négatif = teinte différente
        // (contenu réel du vêtement, ex. un logo d'une autre couleur) à
        // préserver tel quel.
        const alignment = (dr * bgUnit.r + dg * bgUnit.g + db * bgUnit.b) / chroma;
        if (alignment > 0.6) {
          const L = Math.round(mean);
          out[i] = L;
          out[i + 1] = L;
          out[i + 2] = L;
        }
      }
    }
  }

  const cutout = sharp(out, { raw: { width: w, height: h, channels: 4 } });
  const canvas = sharp({
    create: { width: w, height: h, channels: 3, background: TARGET_BG },
  });

  const outPath = relPath.replace(/(\.[a-z]+)$/i, "-neutral.jpg");
  await canvas
    .composite([{ input: await cutout.png().toBuffer() }])
    .jpeg({ quality: 92 })
    .toFile(outPath);

  const bgPct = ((isBg.reduce((a, v) => a + v, 0) / (w * h)) * 100).toFixed(1);
  console.log(`${relPath} -> ${outPath} (fond source: rgb(${bg.r},${bg.g},${bg.b}), fond détecté: ${bgPct}%)`);
  return outPath;
}

(async () => {
  for (const src of SOURCES) {
    await processOne(path.join(process.cwd(), src));
  }
})();
