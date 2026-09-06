# JEUNE RICHE — Direction artistique

Établie après inspection réelle de tous les assets (23 fichiers images + 2 vidéos). Aucune donnée inventée.

## 1. Identité

Logo : visage-roi tribal gravé (yeux mi-clos, point au front, cercle à la gorge, couronne à 7 pointes), wordmark **JEUNE RICHE** en condensé bold. Fichiers source fournis avec fond plein, non transparent (vérifié pixel par pixel). ✅ `public/images/logo/logo-transparent.png` — version réellement détourée (luminance → alpha), générée à partir de l'asset réel, utilisée partout dans l'app (header, footer, intro, confirmation). Ne jamais réintroduire les fichiers `logo-*-on-*.png` bruts dans l'UI — fond plein garanti.

Badge circulaire : wordmark JEUNE RICHE répété en cercle autour du visage, versions noir/blanc et blanc/noir (`badge-*.png`). Utilisé pour dos de vêtement, sceau de section, favicon-like motif.

## 2. Palette

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#0B0B0C` | Fond sombre, texte sur clair |
| `paper` | `#F5F4F1` | Fond clair (jamais blanc pur — légèrement cassé) |
| `blood` | `#C81E2B` | Rouge signature — CTA, accents, fond mockup produit |
| `navy` | `#131B2E` | Réservé à la ligne Polo uniquement |
| `line` | `#26252A` | Hairlines, bordures |
| `studio` | `#E1DED8` | Fond neutre unique de la photographie produit (catalogue, fiche, défilé accueil) |

Confirmé dans les assets : fond rouge des mockups t-shirt, polo bleu marine profond. Pas de dégradé, pas de couleur additionnelle.

**Fond produit uniformisé** : les mockups source ont chacun un aplat de studio différent (rouge, blanc, marron — vérifié : aplat parfaitement uni aux 4 coins de chaque image). `scripts/neutralize-product-backgrounds.js` détoure le vêtement par chroma-key (distance colorimétrique au fond détecté, pas de segmentation ML nécessaire vu l'aplat uni) et le recompose sur `studio` (#E1DED8), gris clair neutre choisi après test — un fond sombre exposait des faux positifs du chroma-key sur les zones claires des vêtements eux-mêmes (ex. casquette blanche). Résultat : chaque visuel catalogue partage désormais le même fond, quel que soit le mockup source. Tout nouveau mockup à fond plein doit passer par ce script avant publication.

## 3. Typographie

- **Display / UI stricte** : condensée bold sans-serif — `Anton` (`font-display`). Réservée au wordmark, à la navigation, aux boutons et labels d'interface. Ne s'utilise plus pour les noms de produits ni les titres de page (correction : une seule police bold condensée partout se lisait comme un site généré, pas comme une marque).
- **Éditorial** : serif expressive — `Fraunces` (`font-editorial`). Manifeste, mais aussi noms de produits, H1 de fiche produit et de page catalogue, titres de section ("Compléter la tenue"). Graisse régulière, jamais en majuscules forcées — cf. l'exécution "Albany Hooded Jacket Onyx" chez A-COLD-WALL*.
- **UI / corps** : sans-serif neutre lisible — `Inter`, jamais en display.

Deux polices maximum par écran (une display/UI, une éditoriale) — jamais les deux mêmes rôles. Le wordmark du logo n'est jamais recomposé en CSS — toujours l'image fournie.

## 4. Vêtements réels (inventaire vérifié)

| Catégorie | Coloris confirmé(s) | Fichiers sources |
|---|---|---|
| T-shirt | Noir, Blanc, Taupe/marron | TSHIRT1,2,3,5,6 + 6 photos WhatsApp |
| Polo | Marine | 1 mockup front+back |
| Chemise | Blanche, manches longues | 1 mockup front+back |
| Débardeur | Noir | 1 mockup front+back |
| Jogger | Gris | 1 mockup front+back |
| Casquette | Blanche | 1 mockup front+back |

Aucune photo mannequin réelle (personne portant le vêtement) n'est disponible : tout est mockup produit sur fond uni (rouge pour le t-shirt noir, fonds neutres/dégradés studio pour le reste). Traité comme référence de design, jamais présenté comme photo de campagne (règle #12 du brief).

Personnalisation : les mockups portent des exemples baked-in (« BAISACHTE », « BELLA_K », « LIONEL_k »). Ce sont des exemples visuels — le champ de personnalisation réel démarre toujours vide.

## 5. Vidéos

- `hero-production.mp4` (20 MB) : travelling showroom 3D, plein écran, page d'accueil uniquement, autoplay/muted/loop/playsInline.
- `manifeste-motif.mp4` (11 MB) : motif mosaïque noir/blanc incliné avec badge, en fond de `/manifeste` uniquement.

Servies depuis `public/video/` (asset statique Next.js/Vercel, pas de fonction serverless). Poster image à générer plus tard pour le fallback (non disponible aujourd'hui — voir TODO).

## 6. Philosophie de mouvement

Trois vitesses, jamais mélangées dans un même écran :
- **Lent** — vidéo, grain, respiration du hero.
- **Scroll** — reveal, parallax léger, stacking sur les drops.
- **Instantané** — hover, curseur, boutons magnétiques.

Performance avant effet : pas de 3D lourde par défaut sur mobile, animations réduites sous `prefers-reduced-motion`.

## 7. Structure homepage

Écran 1 (vidéo hero + logo + nav + CTA) → preuve de marque (badge + wordmark en mouvement) → catégories réelles (grille éditoriale) → manifeste teaser → footer sobre.

## 8. Catalogue / fiche produit

Grille éditoriale 3–4 colonnes desktop, beaucoup d'espace. Fiche produit : galerie (mockups disponibles, slots FRONT/BACK/DETAIL/LIFESTYLE prêts pour vraies photos), personnalisation avec aperçu live, tailles, stock réel (0 par défaut tant que non saisi en admin).

## 9. Admin

Interface sobre, dense, sans 3D ni animation décorative. Priorité lisibilité et vitesse.

## 10. Responsive

Mobile-first. Vidéo hero conservée mais scène 3D/particules désactivées ou simplifiées sous un certain seuil de viewport/puissance.
