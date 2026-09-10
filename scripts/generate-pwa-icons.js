const sharp = require("sharp");
const path = require("path");

const ROOT = "C:/Users/Bella/Downloads/PROJET JEUNE RICHE";
const INK = { r: 11, g: 11, b: 12 };
const SRC = path.join(ROOT, "app/icon.png"); // crest, black line art on transparent, 512x512

async function whiteCrestBuffer() {
  // app/icon.png est un trait noir sur fond transparent : on inverse les
  // canaux RGB (noir -> blanc) en conservant l'alpha tel quel, pour obtenir
  // un trait blanc sur fond transparent, compositable sur le fond sombre de
  // la marque (--color-ink, #0B0B0C), cohérent avec le favicon .jr-logo déjà
  // utilisé partout ailleurs sur le site.
  const img = sharp(SRC);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
    // alpha (data[i+3]) inchangé
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toBuffer();
}

async function makeIcon(crestBuffer, size, scale, outPath) {
  const crestSize = Math.round(size * scale);
  const resizedCrest = await sharp(crestBuffer)
    .resize(crestSize, crestSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: { ...INK, alpha: 1 } },
  })
    .composite([{ input: resizedCrest, gravity: "center" }])
    .png()
    .toFile(outPath);
  console.log("wrote", outPath);
}

(async () => {
  const crest = await whiteCrestBuffer();
  const outDir = path.join(ROOT, "public/icons");
  require("fs").mkdirSync(outDir, { recursive: true });

  // "any" : logo bien visible, marge confortable, jamais rogné par l'OS.
  await makeIcon(crest, 192, 0.62, path.join(outDir, "icon-192.png"));
  await makeIcon(crest, 512, 0.62, path.join(outDir, "icon-512.png"));
  // "maskable" : Android peut appliquer un masque (cercle, squircle...) qui
  // rogne jusqu'à ~20% du bord — le contenu reste dans la zone de sécurité
  // centrale (~50% du canevas) pour ne jamais perdre la couronne ou le
  // menton, fond ink plein cadre (pas de transparence, le masque fait déjà
  // la forme).
  await makeIcon(crest, 192, 0.5, path.join(outDir, "icon-maskable-192.png"));
  await makeIcon(crest, 512, 0.5, path.join(outDir, "icon-maskable-512.png"));
})();
