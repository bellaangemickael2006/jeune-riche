// Détails techniques réels par catégorie — construits à partir de ce qui est
// visuellement vérifiable sur les visuels produit (coupe, emplacement du
// logo, technique de marquage) et des décisions produit déjà actées
// (personnalisation). Aucune donnée n'est inventée : composition tissu,
// grammage et instructions d'entretien précises ne sont pas encore
// communiquées par la marque, donc affichées comme telles plutôt que
// remplies avec des chiffres plausibles.
export type TechnicalDetail = { label: string; value: string };

const BY_CATEGORY: Record<string, TechnicalDetail[]> = {
  "t-shirt": [
    { label: "Coupe", value: "Col rond, coupe droite, manches courtes" },
    { label: "Marquage", value: "Visage-roi tribal poitrine gauche, wordmark dos" },
    { label: "Personnalisation", value: "Nom ou pseudo, poitrine ou manche" },
  ],
  polo: [
    { label: "Coupe", value: "Col polo boutonné, manches courtes" },
    { label: "Marquage", value: "Broderie visage-roi et wordmark, poitrine gauche" },
    { label: "Personnalisation", value: "Nom ou pseudo, poitrine ou manche" },
  ],
  chemise: [
    { label: "Coupe", value: "Col chemise, manches longues, boutonnage complet" },
    { label: "Marquage", value: "Broderie visage-roi et wordmark, poitrine gauche" },
    { label: "Personnalisation", value: "Nom ou pseudo, poitrine ou manchette" },
  ],
  debardeur: [
    { label: "Coupe", value: "Col rond, sans manches" },
    { label: "Marquage", value: "Visage-roi et wordmark, poitrine gauche" },
    { label: "Personnalisation", value: "Nom ou pseudo, poitrine" },
  ],
  jogger: [
    { label: "Coupe", value: "Taille élastique à cordon, chevilles resserrées" },
    { label: "Marquage", value: "Wordmark cuisse gauche, visage-roi mollet" },
    { label: "Personnalisation", value: "Nom ou pseudo, cuisse" },
  ],
  casquette: [
    { label: "Coupe", value: "6 panneaux, visière courbée, dos ajustable" },
    { label: "Marquage", value: "Visage-roi et wordmark en façade" },
  ],
};

export function getTechnicalDetails(categorySlug: string): TechnicalDetail[] {
  const base = BY_CATEGORY[categorySlug] ?? [];
  return [
    ...base,
    { label: "Composition & entretien", value: "Non communiqués par la marque à ce stade" },
  ];
}
