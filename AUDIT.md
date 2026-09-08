# JEUNE RICHE — Audit (PHASE 1 & 2)

Date : 2026-09-08. Méthode : lecture du code réel + inspection du site en production
(https://jeune-riche.vercel.app) à 1440px et 390px, mesures DOM, réseau, console.
Aucun constat ci-dessous n'est supposé : chaque point renvoie à un fichier lu ou à une
mesure faite sur la production.

---

## 1. Architecture existante (inventaire vérifié)

**Stack** — Next.js 15.5.25 (App Router), React 19, TypeScript strict, Tailwind 3,
Prisma + Supabase Postgres, déploiement Vercel sur `master`.

**Routes publiques (13)** — `/`, `/catalogue`, `/catalogue/[slug]`, `/manifeste`,
`/drops`, `/a-propos`, `/favoris`, `/panier`, `/checkout`, `/checkout/confirmation`,
`/compte`, `/compte/reinitialiser`, `/contact`, + pages légales (`/livraison`,
`/retours`, `/conditions`, `/confidentialite`) et `not-found`.

**Routes admin (11)** — dashboard, produits (liste/nouveau/édition), commandes
(liste/détail), clients (liste/détail), catégories, drops, avis, newsletter,
paramètres, login. Shell séparé via `SiteChrome` (`components/providers/SiteChrome.tsx:23`).

**Providers / systèmes transverses**
- `SmoothScroll` (Lenis, scroll natif, reset au changement de route, `window.__lenis`)
- `StoreHydration`, store panier Zustand persistant, favoris en `localStorage`
- `MotionConfig reducedMotion="user"` dans `app/layout.tsx:53`
- Auth Supabase + `requireAdmin` côté serveur, middleware de session

**Composants** — 41 fichiers `.tsx`. Dont 9 composants d'effet :
`CustomCursor`, `GrainOverlay`, `Marquee`, `Magnetic`, `Spotlight`, `TextScramble`,
`WordPullUp`, `FadeIn`, `ImageZoomModal`.

**Assets réels** — 23 images + 2 vidéos. `hero-production.mp4` = **20,8 Mo**,
`manifeste-motif.mp4` = **10,8 Mo** (mesuré). 6 produits publiés, 6 catégories.
Aucune photo mannequin — uniquement des mockups produit détourés sur `studio` #E1DED8.

**Fonctionnalités confirmées opérationnelles** (à ne pas casser) : navigation,
recherche `?q=`, filtres catégorie, tri prix, fiche produit, couleurs/tailles,
personnalisation + aperçu, panier (drawer + page), favoris, compte, checkout 3 étapes
avec décrément de stock transactionnel, avis modérés, admin complet, notification
retour en stock.

---

## 2. Problèmes identifiés — classés par gravité

### A. Bloquants — l'identité est détruite au premier écran

**A1 — Le hero est rouge, et le rouge n'est pas une couleur de la marque.**
`hero-production.mp4` est un travelling 3D saturé de rouge. À 390px, le premier écran
est majoritairement rouge. Le rouge (`blood` #C81E2B) a été **retiré de la marque sur
décision explicite du client** (ART_DIRECTION.md §2) et le token n'existe plus dans
`tailwind.config.ts`. Toute la charte est respectée dans le CSS… et démolie par la
vidéo qui occupe 100% du premier écran.

**A2 — Le wordmark s'écrase sur lui-même.**
`components/home/Hero.tsx:57` superpose un H1 Anton « Jeune Riche » sur une vidéo qui
contient déjà, en très grand, le wordmark « JEUNE RICHE » gravé au sol et aux murs.
Vérifié en capture à 390px : les deux se chevauchent, aucun des deux n'est lisible.
C'est le pire défaut de composition du site.

**A3 — La vidéo hero pèse 20,8 Mo et se charge en `preload="auto"` sur mobile.**
`components/home/Hero.tsx:33`. Sur une connexion mobile ivoirienne, le premier écran
coûte 20 Mo avant même que quoi que ce soit ne soit lisible. Violation directe de §50.
Aucun poster réel : le `poster` pointe sur `badge-white-on-black.png`, un badge
circulaire, pas une image de campagne.

**A4 — La bulle WhatsApp verte.**
`components/ui/WhatsappButton.tsx:10` : `rounded-full`, `bg-[#25D366]` (vert),
`shadow-lg shadow-black/40`, `fixed bottom-5 right-5 z-30`. Cumule quatre interdits :
couleur hors palette (§09), `rounded-full` (§11), ombre flottante douce (§10), gadget
flottant sur toutes les pages. C'est le seul élément coloré du site et il n'appartient
pas à la marque.

### B. Majeurs — ça ressemble à un template

**B1 — Empilement d'effets sur la même zone (§38).**
La page d'accueil cumule simultanément : curseur personnalisé + grain plein écran +
smooth-scroll Lenis + text-scramble + word-pull-up + bouton magnétique + marquee
infini + spotlight au curseur + tilt 3D sur les cartes + glow radial au survol.
Dix idées d'interaction, aucune dominante. C'est précisément la signature « démo IA ».

**B2 — Gradients partout, alors que §10 les interdit.**
- `Hero.tsx:49` : `bg-gradient-to-t from-ink via-ink/10 to-ink/40` sur toute la vidéo
- `ProductShowcase.tsx:86` : `bg-gradient-to-t from-ink/70` sur **chaque** tuile produit
- `ProductCard.tsx:86` : `radial-gradient(280px circle …)` en glow de survol
- `Spotlight.tsx:44` : `radial-gradient(…)` suivant le curseur

**B3 — La composition « image + titre en surimpression » est générique.**
`ProductShowcase.tsx:87` pose le nom du produit en bas à gauche **par-dessus** l'image,
sur un voile dégradé. C'est le pattern par défaut de tous les générateurs de site.
§25 demande l'inverse : image, puis nom, puis prix, **sous** l'image, alignés à gauche.

**B4 — La tuile vedette est un accident de données, pas une décision.**
`ProductShowcase.tsx:19` : `const [feature, ...rest] = items`. La pièce mise en avant en
662×848 est simplement la première du tableau — aujourd'hui **la casquette**. Une
casquette blanche sur fond `studio` #E1DED8, en `object-contain p-6` dans une boîte de
419px de haut à 390px : mesuré en production, la tuile lit comme un **rectangle gris
vide** avec un titre dessus. Le produit vedette est invisible.

**B5 — Blanc sur `studio` : contraste produit insuffisant.**
Même cause sur la fiche T-shirt coloris Blanc et sur la chemise blanche : le vêtement
clair se dissout dans le fond `studio`. Le fond neutre unique était une bonne décision
d'uniformisation, mais il ne tient pas pour les pièces claires.

**B6 — L'information dépend de l'animation (§40).**
`WordPullUp.tsx:27` : `initial={{ y: "110%" }}` dans un parent `overflow-hidden`.
Si `whileInView` ne se déclenche pas, le mot reste **définitivement hors du masque**.
Mesuré en production à 390px : les `<span>` du H2 « Nos pièces » portaient
`transform: matrix(1,0,0,1,0,39.6)` dans un masque de 36px → titre de section
invisible à l'écran. Même risque sur tout titre passé en `WordPullUp`.

**B7 — Filtres catalogue en chips encadrées.**
`CategoryFilters.tsx:20` : sept boutons `border px-4 py-2`, l'actif en `bg-paper`.
C'est une barre de filtres SaaS. §24 demande texte / ligne / taille.

**B8 — Taille produit dans un `<select>`.**
`AddToCart.tsx:105`. §29 interdit explicitement le dropdown et demande S/M/L/XL avec
états default / hover / selected / disabled. En plus, le `<select>` et le bouton
« Ajouter au panier » sont côte à côte sur la même ligne : le CTA principal est réduit
à la moitié droite d'un champ de formulaire.

**B9 — Deux CTA concurrents dans le hero.**
`Hero.tsx:65` « Voir le catalogue » + `Hero.tsx:72` « Le manifeste ». §20 : un seul.

**B10 — Le footer est en 4 colonnes égales.**
`Footer.tsx:59` : `md:grid-cols-[1.2fr_repeat(3,1fr)]` — newsletter + Marque + Service +
Légal. §33 demande deux colonnes inégales. Le wordmark géant au-dessus est bon ; la
grille en dessous annule l'effet.

### C. Mineurs / techniques

**C1 — GSAP chargé pour rien.** `lib/gsap.ts` + `SmoothScroll.tsx:27-34` : GSAP et
ScrollTrigger sont importés uniquement pour piloter le `raf` de Lenis et appeler
`ScrollTrigger.update`. **Aucune animation ScrollTrigger n'existe dans le projet**
(grep : zéro occurrence hors `lib/gsap.ts`). Lenis a sa propre boucle `raf`.

**C2 — `three`, `@react-three/fiber`, `@react-three/drei`,
`@react-three/postprocessing` sont installés et utilisés nulle part** (grep sur tout
`app/` et `components/` : zéro import). Poids mort dans `package.json`.

**C3 — Trois polices en compétition dans le même écran.** Le hero affiche Inter
(eyebrow) + Anton (H1) + le CTA en Inter majuscule ; la carte produit affiche Inter
(catégorie) + Fraunces (nom) + Inter (prix). §13 : deux rôles visibles maximum par zone.

**C4 — Le prix n'utilise pas le rôle typographique prévu.** `ProductCard.tsx:101`
`text-sm text-paper/70` au lieu de `text-caption`. Idem `ProductCard.tsx:98`
`text-[11px]` au lieu de `text-label`. L'échelle typographique existe mais n'est pas
appliquée partout — le design system est déclaré, pas respecté.

**C5 — Badge « Épuisé » en pastille sur l'image.** `ProductCard.tsx:91`. §53 demande
« Indisponible. » + « Prévenez-moi », pas un badge posé sur la photo.

**C6 — L'intro ne passe pas le test §21.** `IntroOverlay.tsx` : écran noir plein cadre
avec le crest pendant 3,2 s, bouton « Passer » en `bottom-10 right-10` — donc dans le
coin, en `text-paper/60`, sur un écran de 390px. §22 interdit d'utiliser le crest comme
gadget d'attente. À 390px l'intro est un écran noir de 3 secondes : soit elle devient
une idée lisible, soit elle disparaît.

**C7 — Le curseur personnalisé casse la lisibilité.** `CustomCursor.tsx:52` +
`globals.css:65` : point `mix-blend-mode: exclusion` de 16px qui grossit ×2,2 au survol
de tout élément interactif. Sur du texte, il l'inverse localement.

---

## 3. Ce qui est bon et ne sera pas touché

- La palette CSS, les tokens, l'échelle typographique nommée (`tailwind.config.ts`).
- Le choix Anton / Fraunces / Inter et leurs rôles (ART_DIRECTION.md §3).
- Le fond `studio` unique pour la photo produit — le principe est juste, seul le cas
  des pièces claires doit être traité.
- Toute la couche fonctionnelle : panier, checkout transactionnel, stock, favoris,
  auth, admin, restock, avis. Rien à reconstruire.
- L'honnêteté du contenu : étiquette « Référence de design — photo produit à venir »
  sur les mockups, états vides factuels, aucun chiffre inventé. À préserver strictement.
- Le reset de scroll au changement de route, le focus-visible clavier, les liens
  sociaux réels (pas d'URL inventée).

---

## 3bis. Avancement (mis à jour le 08/09)

| # | Problème | État |
|---|---|---|
| A1 | Hero rouge | ✅ vidéo retirée, premier écran typographique |
| A2 | Wordmark superposé au wordmark de la vidéo | ✅ résolu par A1 |
| A3 | 20,8 Mo en `preload="auto"` | ✅ plus aucune vidéo sur l'accueil |
| A4 | Bulle WhatsApp verte | ✅ retirée, lien en filet dans le footer |
| B1 | Empilement d'effets | ✅ marquee, spotlight, magnétiques, tilt, glow, scramble, word-pull-up retirés |
| B2 | Dégradés | ✅ zéro dégradé dans le `main` (vérifié en production) |
| B3 | Titre en surimpression sur l'image | ✅ nom et catégorie sous l'image, alignés à gauche |
| B4 | Tuile vedette accidentelle | ✅ colonnes inégales alternées, plus de « vedette » arbitraire |
| B5 | Vêtements clairs invisibles | ✅ cause réelle trouvée : cadres portrait sur assets paysage — voir ART_DIRECTION §4bis |
| B6 | Information dépendante d'une animation | ✅ WordPullUp retiré des titres, apparitions en CSS, aucune sur les grilles produit |
| B7 | Filtres en chips | ✅ texte et filet |
| B8 | `<select>` de taille | ✅ boutons S/M/L/XL, quatre états |
| B9 | Deux CTA dans le hero | ✅ un seul |
| B10 | Footer en 4 colonnes égales | ✅ deux colonnes inégales, icônes sociales remplacées par les noms |
| C1 | GSAP chargé pour rien | ✅ retiré avec `lib/gsap.ts` — Lenis a sa propre boucle raf |
| C2 | three.js inutilisé | ✅ quatre paquets retirés |
| C3 | Trois polices en compétition | ✅ deux rôles par zone après le passage de `label` en Anton |
| C4 | Rôles typographiques non appliqués | ✅ carte produit, fiche, panier, footer, états |
| C5 | Badge « Épuisé » sur la photo | ✅ ligne « Indisponible » sous le nom |
| C6 | Intro non conforme au §21 | ✅ 1,3 s, sortie sur toute la surface, Échap, filet de progression |
| C7 | Curseur personnalisé en `mix-blend-mode` | ✅ retiré, avec le grain plein écran |

**Les 22 problèmes de l'audit sont traités.**

### Défauts fonctionnels découverts pendant l'exécution

Ils ne figuraient pas dans l'audit initial — ils ont été trouvés en écrivant la
suite de tests, pas en lisant le code.

| Défaut | État |
|---|---|
| La recherche du header ne faisait rien : `onClose()` démontait le panneau dans le même gestionnaire que `router.push` | ✅ corrigé, plus un bouton « Rechercher » visible |
| Deux boutons portaient le nom accessible « Rechercher » | ✅ l'icône devient « Ouvrir la recherche » |
| Une action faite avant la réhydratation des stores était silencieusement écrasée | ✅ drapeau `touched` + `merge` |
| Squelettes de chargement à la géométrie de l'ancienne mise en page | ✅ alignés (le contenu ne saute plus à l'arrivée) |
| Soft-404 sur les fiches produit (statut 200) | ⚠️ non résolu — voir TESTS.md et TODO.md |

## 4. Plan d'exécution

Ordre imposé par le brief (§57). Chaque phase est livrée, testée en production réelle à
390 / 768 / 1024 / 1440, puis validée avant la suivante.

| Phase | Contenu | Livrable |
|---|---|---|
| 3 | Design system : figer les tokens manquants (spacing, grille, bordures, radius 0/2/4/8, motion, boutons, inputs, états) et faire respecter l'échelle typo partout | `ART_DIRECTION.md` mis à jour + tokens Tailwind |
| 4 | Recherche ciblée (références éditoriales fashion, patterns 21st.dev filtrés) | notes de direction |
| 5 | Header : hiérarchie, deux rôles typo max, retrait du magnétique, menu mobile | `Header.tsx` |
| 6 | Homepage : hero (A1→A4), narration 01→07, retrait des gradients, tuiles refaites | `Hero`, `CategoryGrid`, `ProductShowcase`, `ManifesteTeaser` |
| 7 | Catalogue : filtres texte/ligne (B7), rythme, gouttières | `CategoryFilters`, `catalogue/page` |
| 8 | Product card : info sous l'image (B3), une seule interaction de survol (B2) | `ProductCard.tsx` |
| 9 | PDP : poids à la photo, tailles en boutons (B8), CTA unique, atelier de personnalisation | `ProductViewer`, `Gallery`, `AddToCart` |
| 10 | Panier : drawer sur `ink` + filets `line` (aujourd'hui sur `paper`) | `CartDrawer.tsx` |
| 11 | Footer : deux colonnes inégales (B10) | `Footer.tsx` |
| 12 | États : loading / empty / error / selected / disabled / rupture (C5) | transverse |
| 13 | Mobile 390 : lisibilité, CTA au-dessus de la ligne de flottaison | transverse |
| 14 | Motion : trois vitesses, retrait de l'empilement (B1), aucune info dépendante d'une animation (B6) | `FadeIn`, `WordPullUp`, retrait ciblé |
| 15 | QA : 14 tests §63 + non-régression fonctionnelle §52 | `TESTS.md` |
| 16 | Nettoyage : GSAP (C1), three.js (C2), composants morts | `package.json` |

**Décision sur Lovable.** Le workspace Lovable est vide (0 projet, 0 design system,
0 template — vérifié). Il n'y a donc rien à en extraire aujourd'hui. Je ne crée un
projet laboratoire jetable que si une phase précise butte sur un choix de composition,
et uniquement pour en extraire une décision recodée à la main ici. Le vrai site reste
la seule source de vérité (§01, §44).

---

## 5. Refus assumés (§60) — première série

```
REFUS : Garder la vidéo hero rouge.
RAISON : Le rouge a été retiré de la marque par décision du client ; il occupe
         aujourd'hui 100% du premier écran mobile.
ALTERNATIVE : Cadrage sombre de la vidéo + traitement désaturé, ou plan fixe
         matière/vêtement, en attendant l'asset de remplacement annoncé.
```
```
REFUS : Superposer le H1 « Jeune Riche » à une vidéo qui contient déjà le wordmark.
RAISON : Deux wordmarks se détruisent mutuellement ; aucun n'est lisible à 390px.
ALTERNATIVE : Le wordmark reste dans le header ; le hero porte une phrase manifeste
         courte en Fraunces et un seul CTA.
```
```
REFUS : La bulle WhatsApp verte flottante.
RAISON : Couleur hors palette, rounded-full, ombre douce, gadget permanent.
ALTERNATIVE : Lien « WhatsApp » en filet, dans le footer et sur la fiche produit,
         là où la question d'achat se pose réellement.
```
```
REFUS : Les dégradés de lisibilité sur les images produit.
RAISON : Interdit §10, et symptôme du pattern « image-card + titre en surimpression ».
ALTERNATIVE : Nom et prix sous l'image, alignés à gauche, sur fond ink.
```
```
REFUS : Le tilt 3D + glow radial au survol des cartes produit.
RAISON : Deux effets empilés sur une zone qui doit montrer un vêtement, pas une carte.
ALTERNATIVE : Une seule interaction — swap d'image face/dos.
```
```
REFUS : Le <select> pour les tailles.
RAISON : Interdit §29 ; réduit le CTA principal à un demi-champ de formulaire.
ALTERNATIVE : S M L XL en boutons rectangulaires, quatre états explicites.
```
```
REFUS : Le curseur personnalisé en mix-blend-mode exclusion.
RAISON : Inverse localement le texte qu'il survole ; effet de démo, pas d'identité.
ALTERNATIVE : Curseur natif. Le caractère vient de la composition, pas du pointeur.
```
```
REFUS : Charger GSAP + ScrollTrigger et 4 paquets three.js.
RAISON : Zéro usage réel dans le code ; poids et complexité pour rien.
ALTERNATIVE : Boucle raf native de Lenis ; suppression des dépendances mortes.
```
```
REFUS : Laisser une casquette blanche comme pièce vedette de 848px de haut.
RAISON : Ce n'est pas une décision éditoriale, c'est l'ordre du tableau de données ;
         et le produit est invisible sur le fond studio.
ALTERNATIVE : Pièce vedette choisie explicitement, et traitement du contraste pour
         les vêtements clairs.
```
```
REFUS : Un titre de section qui n'existe que si une animation se déclenche.
RAISON : §40 — aucune information ne doit dépendre d'une animation.
ALTERNATIVE : Reveal en opacité + 8–12px depuis un état déjà lisible.
```
