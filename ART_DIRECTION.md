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

| Rôle | Taille | Police associée | Usage |
|---|---|---|---|
| `label` | 11px, majuscules, `tracking-widest2` | `font-body` | Eyebrows, nav, badges, méta |
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

**Mise à jour du 11/09 — la marque a fourni ses premières vraies photos.** Cinq visuels réels sont désormais dans le projet (`public/images/campagne/` et les dossiers produit), et ils priment sur les mockups partout où ils s'appliquent :

| Fichier | Sujet | Où il sert | Définition |
|---|---|---|---|
| `campagne/portant-atelier.jpg` | T-shirt noir sur un portant, silhouette assise | Fond du hero d'accueil | 1400×1600 — le seul assez grand pour un plein cadre |
| `campagne/porte-dos-ciel.jpg` | Porté de dos, badge imprimé au dos, ciel | Section « Porté » + galerie fiche produit (Blanc) | 696×724 |
| `campagne/porte-voiture.jpg` | Porté, assis dans une voiture | Section « Porté » + galerie fiche produit (Blanc) | 720×725 |
| `products/tshirt-blanc/personnalisation-aura.jpg` | Flat-lay, personnalisation « AURA. » | Galerie fiche produit (Blanc) | 432×540 |
| `products/tshirt-noir/personnalisation-bella.jpg` | Flat-lay, personnalisation « BELLA » | Galerie fiche produit (Noir) | 416×520 |

Recadrages appliqués (voir `scripts/import-campagne-assets.js`), uniquement pour lever un blocage d'usage, jamais pour embellir :
- le portant portait un filigrane **doré** incrusté en bas à gauche — le doré n'appartient pas à la palette, la colonne de gauche a été recadrée ;
- les deux flat-lay ont été resserrés sur le vêtement pour sortir du cadre des livres et objets de marques tierces.

Contrainte à retenir : **les photos portées ne font que ~720 px**. Elles ne doivent jamais être affichées au-delà de cette largeur (d'où deux colonnes et non un plein cadre dans la section « Porté »). Pour un hero plein cadre, il faudra des fichiers plus définis.

Les mockups produit sur fond `studio` restent la référence du catalogue tant qu'une vraie photo ne couvre pas la pièce concernée. Ils ne sont jamais présentés comme des photos de campagne.

Personnalisation : les mockups portent des exemples baked-in (« BAISACHTE », « BELLA_K », « LIONEL_k »). Ce sont des exemples visuels — le champ de personnalisation réel démarre toujours vide.

## 5. Vidéos

- `hero-production.mp4` (20 MB) : travelling showroom 3D. **Retiré du hero le 10/09 sur décision du client** — l'accueil s'ouvre désormais sur une vraie photo (`campagne/portant-atelier.jpg`). Le fichier est conservé pour un usage ultérieur, il n'est plus référencé par aucun composant.
- `manifeste-motif-720.mp4` (1,9 MB) et `manifeste-motif-480.mp4` (1,1 MB, téléphones) : motif mosaïque noir/blanc incliné avec badge, en fond de `/manifeste` uniquement. Recompressés le 21/10 depuis l'original de 10,8 MB (H.264 CRF 26, sans son, faststart) ; écart à l'original imperceptible (SSIM 0,995 en 720p).

Servies depuis `public/video/` (asset statique Next.js/Vercel, pas de fonction serverless). Poster image à générer plus tard pour le fallback (non disponible aujourd'hui — voir TODO).

## 6. Philosophie de mouvement

Trois vitesses, jamais mélangées dans un même écran :
- **Lent** — vidéo, grain, respiration du hero.
- **Scroll** — reveal, parallax léger, stacking sur les drops.
- **Instantané** — hover, curseur, boutons magnétiques.

Performance avant effet : pas de 3D lourde par défaut sur mobile, animations réduites sous `prefers-reduced-motion`.

## 7. Structure homepage

Écran 1 (photo d'atelier plein cadre + accroche + CTA, texte en bas à gauche) → catégories réelles (grille éditoriale) → **Porté** (deux photos de campagne, légendes factuelles) → manifeste teaser → footer sobre.

## 8. Catalogue / fiche produit

Grille éditoriale 3–4 colonnes desktop, beaucoup d'espace. Fiche produit : galerie (mockups disponibles, slots FRONT/BACK/DETAIL/LIFESTYLE prêts pour vraies photos), personnalisation avec aperçu live, tailles, stock réel (0 par défaut tant que non saisi en admin).

## 9. Admin

Interface sobre, dense, sans 3D ni animation décorative. Priorité lisibilité et vitesse.

## 10. Responsive

Mobile-first. Vidéo hero conservée mais scène 3D/particules désactivées ou simplifiées sous un certain seuil de viewport/puissance.
