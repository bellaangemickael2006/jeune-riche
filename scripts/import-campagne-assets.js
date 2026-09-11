// Importe les photos de campagne fournies par la marque dans public/.
// Chaque image est recadrée pour une raison précise, documentée ci-dessous —
// aucune retouche esthétique, seulement ce qui empêchait l'usage tel quel :
//   - le portant : filigrane doré incrusté en bas à gauche (le doré ne fait
//     pas partie de la palette), retiré en recadrant la colonne de gauche ;
//   - les deux flat-lay : recadrés serré sur le vêtement pour sortir du cadre
//     les livres et objets tiers (marques qui ne sont pas les nôtres) et
//     obtenir le même rapport 4/5 que la grille catalogue ;
//   - les deux photos portées : réencodées sans recadrage, elles sont déjà
//     cadrées juste (et trop petites — 720px — pour être rognées davantage).
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "C:/Users/Bella/Downloads/JEUNE RICHE/JEUNE RICHE/";
const OUT = path.join(__dirname, "..", "public", "images");

const JOBS = [
  {
    src: "MAQUETTE MANNEQUIN 2.PNG",
    out: "campagne/porte-dos-ciel.jpg",
    // Dos + badge circulaire imprimé, ciel dégagé. Aucune retouche.
  },
  {
    src: "MAQUETTE MANNEQUIN.PNG",
    out: "campagne/porte-voiture.jpg",
    // Porté, assis côté conducteur. Aucune retouche.
  },
  {
    src: "MAQUETTE TSHIRT CEINTE.jpeg",
    out: "campagne/portant-atelier.jpg",
    // x >= 200 : évacue le filigrane doré (il s'arrête vers x=190) sans
    // entamer la silhouette assise (elle commence vers x=250).
    extract: { left: 200, top: 0, width: 1400, height: 1600 },
  },
  {
    src: "TSHIRT BLANC NEWMODELE.PNG",
    out: "products/tshirt-blanc/personnalisation-aura.jpg",
    extract: { left: 194, top: 137, width: 432, height: 540 },
  },
  {
    src: "TSHIRT NOIR NEW MODELE.PNG",
    out: "products/tshirt-noir/personnalisation-bella.jpg",
    extract: { left: 154, top: 157, width: 416, height: 520 },
  },
];

(async () => {
  for (const job of JOBS) {
    const target = path.join(OUT, job.out);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    let pipeline = sharp(SRC + job.src);
    if (job.extract) pipeline = pipeline.extract(job.extract);

    await pipeline.jpeg({ quality: 86, mozjpeg: true }).toFile(target);

    const meta = await sharp(target).metadata();
    const kb = Math.round(fs.statSync(target).size / 1024);
    console.log(job.out.padEnd(50), meta.width + "x" + meta.height, kb + " Ko");
  }
})();
