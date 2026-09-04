# JEUNE RICHE — Direction artistique

Établie après inspection réelle de tous les assets (23 fichiers images + 2 vidéos). Aucune donnée inventée.

## 1. Identité

Logo : visage-roi tribal gravé (yeux mi-clos, point au front, cercle à la gorge, couronne à 7 pointes), wordmark **JEUNE RICHE** en condensé bold. Deux fichiers fournis : `logo-black-on-white.png` (fond blanc) et `logo-white-on-black.png` (fond noir) — **fonds pleins, non transparents**. À utiliser tels quels sur fond correspondant ; ne pas prétendre à une version détourée tant qu'elle n'existe pas (voir TODO).

Badge circulaire : wordmark JEUNE RICHE répété en cercle autour du visage, versions noir/blanc et blanc/noir (`badge-*.png`). Utilisé pour dos de vêtement, sceau de section, favicon-like motif.

## 2. Palette

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#0B0B0C` | Fond sombre, texte sur clair |
| `paper` | `#F5F4F1` | Fond clair (jamais blanc pur — légèrement cassé) |
| `blood` | `#C81E2B` | Rouge signature — CTA, accents, fond mockup produit |
| `navy` | `#131B2E` | Réservé à la ligne Polo uniquement |
| `line` | `#26252A` | Hairlines, bordures |

Confirmé dans les assets : fond rouge des mockups t-shirt, polo bleu marine profond. Pas de dégradé, pas de couleur additionnelle.

## 3. Typographie

- **Display / titres** : une condensée bold sans-serif (registre proche du wordmark) — `Archivo Black` / `Anton` en attendant une éventuelle police de marque dédiée.
- **Éditorial** : serif expressive avec restreinte — `Fraunces`, utilisée pour citations/manifeste uniquement.
- **UI / corps** : sans-serif neutre lisible — `Inter` en poids réduit, jamais en display.

Une seule paire à la fois par écran. Le wordmark du logo n'est jamais recomposé en CSS — toujours l'image fournie.

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
