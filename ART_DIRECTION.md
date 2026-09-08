# JEUNE RICHE — Direction artistique

Établie après inspection réelle de tous les assets (23 fichiers images + 2 vidéos). Aucune donnée inventée.

## 1. Identité

Logo : visage-roi tribal gravé (yeux mi-clos, point au front, cercle à la gorge, couronne à 7 pointes), wordmark **JEUNE RICHE** en condensé bold. Fichiers source fournis avec fond plein, non transparent (vérifié pixel par pixel). ✅ `public/images/logo/logo-transparent.png` — version réellement détourée (luminance → alpha), générée à partir de l'asset réel, utilisée partout dans l'app (header, footer, intro, confirmation). Ne jamais réintroduire les fichiers `logo-*-on-*.png` bruts dans l'UI — fond plein garanti.

Badge circulaire : wordmark JEUNE RICHE répété en cercle autour du visage, versions noir/blanc et blanc/noir (`badge-*.png`). Utilisé pour dos de vêtement, sceau de section, favicon-like motif.

## 2. Palette

⚠️ **Correction du 06/09** : le rouge (`blood`, `#C81E2B`) a été retiré de toute l'interface sur décision explicite du client — il ne fait pas partie des couleurs de la marque. Il servait de CTA/accent depuis la lecture initiale du fond rouge des mockups t-shirt, mais ce rouge est un choix de studio de mockup, pas une couleur de marque revendiquée. Toutes les occurrences (boutons, focus, liens, badges d'erreur admin, emails transactionnels) sont repassées à `paper`/`ink`. Le token n'existe plus dans `tailwind.config.ts`. Le hero vidéo de la page d'accueil (qui contient du rouge à l'image) sera remplacé par le client ultérieurement.

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#0B0B0C` | Fond sombre, texte sur clair |
| `paper` | `#F5F4F1` | Fond clair (jamais blanc pur — légèrement cassé) ; sert aussi d'accent (CTA, focus, actif) depuis le retrait du rouge |
| `navy` | `#131B2E` | Réservé à la ligne Polo uniquement |
| `line` | `#26252A` | Hairlines, bordures |
| `studio` | `#E1DED8` | Fond neutre unique de la photographie produit (catalogue, fiche, défilé accueil) |

Pas de dégradé, pas de couleur additionnelle. Palette actuelle : noir / blanc uniquement (+ navy pour le polo, seule couleur vêtement réelle qui l'exige).

**Fond produit uniformisé** : les mockups source ont chacun un aplat de studio différent (rouge, blanc, marron — vérifié : aplat parfaitement uni aux 4 coins de chaque image). `scripts/neutralize-product-backgrounds.js` détoure le vêtement par chroma-key (distance colorimétrique au fond détecté, pas de segmentation ML nécessaire vu l'aplat uni) et le recompose sur `studio` (#E1DED8), gris clair neutre choisi après test — un fond sombre exposait des faux positifs du chroma-key sur les zones claires des vêtements eux-mêmes (ex. casquette blanche). Résultat : chaque visuel catalogue partage désormais le même fond, quel que soit le mockup source. Tout nouveau mockup à fond plein doit passer par ce script avant publication.

## 3. Typographie

- **Display / UI stricte** : condensée bold sans-serif — `Anton` (`font-display`). Réservée au wordmark, à la navigation, aux boutons et labels d'interface. Ne s'utilise plus pour les noms de produits ni les titres de page (correction : une seule police bold condensée partout se lisait comme un site généré, pas comme une marque).
- **Éditorial** : serif expressive — `Fraunces` (`font-editorial`). Manifeste, mais aussi noms de produits, H1 de fiche produit et de page catalogue, titres de section ("Compléter la tenue"). Graisse régulière, jamais en majuscules forcées — cf. l'exécution "Albany Hooded Jacket Onyx" chez A-COLD-WALL*.
- **UI / corps** : sans-serif neutre lisible — `Inter`, jamais en display.

Deux polices maximum par écran (une display/UI, une éditoriale) — jamais les deux mêmes rôles. Le wordmark du logo n'est jamais recomposé en CSS — toujours l'image fournie.

### 3bis. Échelle typographique (design system)

Cinq rôles nommés, disponibles comme tailles Tailwind (`text-label`, `text-caption`, `text-body`, `text-heading`, `text-heading-lg`, `text-display`) en plus des tailles Tailwind standard — additif, rien n'est retiré. Un composant reconstruit doit utiliser un de ces rôles plutôt qu'une taille arbitraire ad hoc.

⚠️ **Correction du 08/09** : le rôle `label` porte désormais la display condensée (Anton), plus le sans neutre. Eyebrows, navigation, boutons, en-têtes de champ et méta sont des éléments d'interface : Inter y était contraire à la règle « le sans neutre jamais en titre, en navigation principale ni en CTA », et donnait à toute l'interface la texture d'un tableau de bord. Réglé en un seul endroit (`.text-label` dans `app/globals.css`) plutôt qu'en ajoutant `font-display` sur trente-trois classes. Exception : une phrase explicative n'est pas un label et reste en `text-caption` (ex. l'étiquette « Référence de design — photo produit à venir » de la galerie).

| Rôle | Taille | Police associée | Usage |
|---|---|---|---|
| `label` | 11px, majuscules, `tracking-widest2` | `font-display` | Eyebrows, nav, boutons, en-têtes de champ, méta |
| `caption` | 13px | `font-body` | Prix, infos secondaires |
| `body` | 15px | `font-body` | Paragraphes, descriptions |
| `heading` | 28px | `font-editorial` | Titres de section |
| `heading-lg` | 44px | `font-editorial` | H1 de page |
| `display` | 56px | `font-display` | Wordmark UI, très grands titres UI stricte |

Le hero (titre `Jeune Riche` en `vw`) reste une exception assumée : un display responsive à l'échelle du viewport, pas un rôle de grille de contenu.

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

### 4bis. Format des cadres image (mesuré le 08/09)

Les 27 visuels produit du dépôt sont **tous en paysage** : ratio 1,250 (1600×1280) pour vingt d'entre eux, ~1,40 (≈631×446) pour les sept mockups du t-shirt noir. **Aucun n'est en portrait.**

Conséquence : tout cadre produit est en `aspect-[5/4]` avec `object-contain`, jamais en 4/5. Les cadres portrait utilisés jusqu'au 08/09 (carte catalogue, galerie de fiche produit, tuiles d'accueil) réduisaient systématiquement le vêtement à une vignette perdue au centre d'un aplat de studio — la casquette blanche disparaissait entièrement. Le léger letterbox du 5/4 est invisible puisque le fond de l'image est déjà `studio`.

`object-cover` est exclu sur ces visuels : un recadrage couperait les cols et les ourlets.

Corollaire : le catalogue passe à **une seule colonne sous 640px**. En deux colonnes à 390px, une paire face+dos tombe sous 80px de large par vêtement. Deux colonnes redeviendront justes le jour où des plans face seule existeront.

## 5. Vidéos

- ⚠️ `hero-production.mp4` (20 MB) : **retirée de la page d'accueil le 08/09.** Trois raisons cumulées — elle est saturée du rouge retiré de la marque (§2) et occupait 100% du premier écran mobile ; elle contient déjà le wordmark « JEUNE RICHE » gravé en très grand, qui entrait en collision avec le H1 posé par-dessus (vérifié à 390px : aucun des deux n'était lisible) ; elle coûtait 20,8 Mo en `preload="auto"` avant le premier texte affiché. Le fichier reste dans le dépôt en attendant l'asset de remplacement annoncé par le client. Le premier écran est aujourd'hui typographique — aucun mockup produit n'a été mis à sa place, afficher un mockup en plein cadre reviendrait à simuler une photographie de campagne qui n'existe pas.
- `manifeste-motif.mp4` (11 MB) : motif mosaïque noir/blanc incliné avec badge, en fond de `/manifeste` uniquement.

Servies depuis `public/video/` (asset statique Next.js/Vercel, pas de fonction serverless). Poster image à générer plus tard pour le fallback (non disponible aujourd'hui — voir TODO).

## 6. Philosophie de mouvement

Trois vitesses, jamais mélangées dans un même écran :
- **Lent** — vidéo, grain, respiration du hero.
- **Scroll** — reveal, parallax léger, stacking sur les drops.
- **Instantané** — hover, curseur, boutons magnétiques.

Performance avant effet : pas de 3D lourde par défaut sur mobile, animations réduites sous `prefers-reduced-motion`.

## 7. Structure homepage

Narration numérotée, chaque section ouverte par un rail (index à gauche, méta à droite, filet `line`) :

- **01 — La marque** : premier écran typographique, plein cadre, affirmation en Fraunces calée en bas à gauche, vide tenu sur toute la droite, CTA unique « Voir la collection », index des six catégories en rail bas.
- **02 — La gamme** : titre éditorial puis six tuiles en colonnes inégales dont l'axe bascule à chaque rangée (7/5 → 5/7 → 7/5). Nom et catégorie **sous** l'image, alignés à gauche, jamais en surimpression sur un voile.
- **03 — Le manifeste** : bloc décalé vers la droite, là où les deux sections précédentes laissaient le vide. Un seul lien.
- Footer.

Retirés le 08/09 : marquee de marque en défilement infini, spotlight suivant le curseur, boutons magnétiques, badge en filigrane à 4%, et tous les dégradés de lisibilité posés sur les images.

## 7bis. Ce qui est interdit dans l'interface

Aucun dégradé (vérifié en production : zéro élément à `background-image: gradient` dans le `main`). Aucun `rounded-full`. Aucune ombre portée douce. Aucune couleur hors des cinq tokens. Aucun badge promotionnel, prix barré ou pourcentage. Une seule idée d'interaction dominante par zone — jamais de tilt + glow + scale empilés.

## 8. Catalogue / fiche produit

Grille éditoriale 3–4 colonnes desktop, beaucoup d'espace. Fiche produit : galerie (mockups disponibles, slots FRONT/BACK/DETAIL/LIFESTYLE prêts pour vraies photos), personnalisation avec aperçu live, tailles, stock réel (0 par défaut tant que non saisi en admin).

## 9. Admin

Interface sobre, dense, sans 3D ni animation décorative. Priorité lisibilité et vitesse.

## 10. Responsive

Mobile-first. Vidéo hero conservée mais scène 3D/particules désactivées ou simplifiées sous un certain seuil de viewport/puissance.
