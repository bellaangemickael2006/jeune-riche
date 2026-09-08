# JEUNE RICHE — TODO

## Bloquant pour un premier déploiement réel

1. ✅ **Projet Supabase créé** : `jeune-riche-ecommerce` (org `jeuneriche`, région eu-west-1). Un premier projet réutilisé par erreur ("jeuneriche projet") contenait déjà des données réelles d'une tout autre activité (contacts/formations) — abandonné intact, jamais touché, pour ne rien écraser.
2. ✅ **Migrations appliquées** (`20260906133710_init`) sur la base réelle.
3. ✅ **Seed de développement exécuté puis publié** — 6 catégories et 6 produits réels créés ; les 6 sont maintenant `published: true` avec un prix réel de 7 000 FCFA (prix temporaire communiqué explicitement par le client, modifiable en admin) et 12 unités de stock par variante.
4. ✅ **Variables d'environnement configurées** dans `.env.local`/`.env` (local) et sur Vercel (Production) : `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`. SMTP (`SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`) configuré en local uniquement — **manquant sur Vercel Production**, voir section dédiée ci-dessous.
5. **Créer un compte admin** : s'inscrire via `/compte` sur le site, puis en base :
   ```sql
   update users set role = 'ADMIN' where email = '<email utilisé à l inscription>';
   ```
6. ✅ **Prix et stocks saisis, produits publiés** — les 6 produits sont visibles dans `/catalogue`. Le prix de 7 000 FCFA est une valeur temporaire à ajuster en admin dès que les prix définitifs seront fixés.
7. **Choisir et intégrer un prestataire de paiement** (Stripe ou solution locale) — le tunnel de checkout crée aujourd'hui la commande sans encaisser, ce qui est explicitement indiqué au client. Ne jamais afficher "paiement sécurisé" tant que ce n'est pas branché.
8. **Ajouter les variables SMTP sur Vercel (Production)** : `SMTP_USER=bellaangemickael2006@gmail.com`, `SMTP_PASSWORD` (mot de passe d'application Gmail 16 caractères), `SMTP_FROM_NAME=Jeune Riche` — bloqué en attente d'une reconnexion du client à Vercel dans le navigateur (session expirée ; jamais saisi d'identifiants à sa place).

## Trouvé pendant la refonte visuelle du 08/09 — à traiter

1. ✅ **Soft-404 sur les fiches produit — corrigé.** `/catalogue/<slug-inexistant>` renvoie désormais un vrai 404. La cause était une frontière Suspense : le `loading.tsx` du segment **parent** `/catalogue` englobait aussi `[slug]` et faisait partir la réponse en streaming avant que `notFound()` ne puisse fixer le statut. La liste vit maintenant dans le groupe de routes `(liste)`. Ne pas réintroduire de `loading.tsx` dans `app/catalogue/` ni dans `app/catalogue/[slug]/` — voir TESTS.md.
2. **Photographies produit face seule.** C'est aujourd'hui la principale limite du site. Les 27 visuels sont des paires face+dos en paysage (1600×1280). Conséquences visibles : le catalogue est en **une seule colonne sous 640px** (deux colonnes mettraient chaque vêtement sous 80px de large), et aucun cadre portrait n'est utilisable nulle part. Des plans face seule débloqueraient la grille mobile à deux colonnes et des compositions verticales.
3. **Vidéo de remplacement pour le premier écran.** `hero-production.mp4` est retirée de l'accueil (rouge hors marque, wordmark en collision, 20,8 Mo). `manifeste-motif.mp4` est retirée du manifeste (10,8 Mo, motif du badge répété). Les deux fichiers restent dans le dépôt.
4. **Photo dos du t-shirt taupe** — toujours manquante (voir ci-dessous).

## Assets manquants (documenté, non inventé)

- **Aucune photo mannequin réelle.** Tous les produits utilisent des mockups (TSHIRT1-6, photos WhatsApp) comme référence de design. L'architecture `ProductImage.type` (FRONT/BACK/DETAIL/LIFESTYLE/MOCKUP) est prête à recevoir de vraies photos de campagne depuis `/admin/produits/[id]` sans changement de code.
- Le t-shirt taupe/marron manque de photo dos (`BACK`) — seules 3 vues face existent.
- ✅ **Logo détouré** : les fichiers source (`logo.PNG`, `logo jeune riche.PNG`) ont un fond noir plein sans canal alpha réel (vérifié pixel par pixel — aucune transparence malgré le mode "truecolor+alpha"). Un vrai PNG transparent (`public/images/logo/logo-transparent.png`) a été généré à partir de l'asset réel (luminance → alpha, blanc partout) et remplace le hack `mix-blend-screen` (qui laissait un carré visible dès que l'arrière-plan n'était pas uniformément noir, à cause de l'isolation de blending créée par `backdrop-filter` sur le header). Utilisé dans Header, Footer, IntroOverlay et la page de confirmation.
- Poster/thumbnail statique des deux vidéos (pour le fallback avant lecture) — actuellement le fallback utilise l'image badge, pas une vraie frame vidéo extraite.

## Informations commerciales manquantes (jamais inventées, à fournir)

- Prix réels de chaque produit.
- Politique de livraison et de retours réelles (`/livraison`, `/retours` n'existent pas encore).
- Coordonnées de contact réelles (`/contact` n'existe pas encore).
- CGV / politique de confidentialité réelles (`/conditions`, `/confidentialite` n'existent pas encore).
- Grille tarifaire de livraison (actuellement `shippingCost = 0` par défaut dans `/api/checkout`).
- Guide des tailles réel (mesures) — aucun `SizeGuide` n'est seedé, le composant reste masqué tant qu'aucune donnée n'existe.

## Fonctionnalités prévues par le brief mais non implémentées cette session

- ✅ Upload direct (Supabase Storage, bucket `product-media`) — l'admin sélectionne un fichier image ou vidéo, en voit le rendu réel (aperçu local) avant de confirmer l'ajout, puis le fichier est uploadé et son URL publique enregistrée (`ProductImage` ou `Product.videoUrl`). Le bucket est créé automatiquement au premier upload si absent.
- ✅ `/admin/produits` affiche désormais une grille visuelle (vignette + statut + prix + stock) au lieu d'un tableau texte ; modification/suppression de produit, variantes et images restent disponibles depuis `/admin/produits/[id]`.
- Catégories : pas encore de CRUD admin dédié (les 6 catégories réelles sont seedées ; les créer/modifier se fait encore en base ou via script).
- Favoris : implémentés côté client (`/favoris`, bouton sur la fiche produit, persistant en localStorage). Le modèle `WishlistItem` existe en base pour une synchronisation par compte, non branchée — pour l'instant les favoris sont liés à l'appareil, pas au compte.
- Compte client (`/compte`) : inscription, connexion et historique de commandes réels (Supabase Auth). Non testé de bout en bout faute de projet Supabase provisionné cette session.
- `/drops` affiche les vrais drops en base (vide pour l'instant) ; `/a-propos`, `/livraison`, `/retours`, `/contact`, `/conditions`, `/confidentialite` existent en placeholders honnêtes ("à venir") plutôt qu'en 404 — contenu réel à fournir avant l'ouverture des ventes.
- Multilingue FR/EN (architecture non démarrée).
- Multi-devise (architecture non démarrée).
- Carte cadeau (hors scope tant que non demandé explicitement).
- Scène 3D — ❌ abandonnée. `three`, `@react-three/fiber`, `@react-three/drei` et `@react-three/postprocessing` étaient installés et importés nulle part ; les quatre paquets ont été retirés le 08/09. La direction artistique tranche d'ailleurs en faveur de la photographie contre la 3D.
- ✅ Lenis (smooth scroll) branché globalement. GSAP et ScrollTrigger ont été retirés le 08/09 : ils n'étaient importés que pour piloter la boucle `raf` de Lenis — qui a la sienne — et aucune animation ScrollTrigger n'existait dans le projet.
- ❌ Marquee, spotlight, grain, curseur personnalisé, boutons magnétiques, tilt 3D, word-pull-up, text-scramble — tous **retirés** le 08/09. Dix idées d'interaction empilées sur un même écran, c'est la signature d'un site de démonstration, pas d'une marque. Une zone = une interaction dominante.
- Sticky stacking — non implémenté, et à ne pas ajouter par défaut : ce serait un effet de plus sans contenu à servir.
- Bloom/post-processing 3D — ❌ abandonné avec la scène 3D.
- Tests automatisés : scaffold Playwright ajouté (`playwright.config.ts`, `tests/navigation.spec.ts`) couvrant les parcours vérifiables sans base de données (navigation, états vides, 404, redirection admin). À étendre avec des parcours commerce réels (`tests/commerce.spec.ts`) maintenant que Supabase est provisionné, une fois un produit publié.

## Dette technique connue

- `npm audit` signale des vulnérabilités dans des dépendances transitives (à revérifier avant mise en production, `npm audit fix` sans `--force` d'abord).
- Le build affiche des logs `prisma:error` bruyants pendant `next build` quand `DATABASE_URL` est absent (comportement attendu et sans échec de build, mais à nettoyer si ça gêne le CI).
- Pas de rate limiting sur les routes API (`/api/checkout`, `/api/newsletter`, `/api/restock`) — à ajouter avant la production (ex. Upstash Ratelimit).
- ✅ **Lenteur de navigation corrigée** : chaque changement de page interrogeait Supabase (base distante) sans cache, mesuré à 2-5s par navigation en dev. Les lectures (`lib/data/products.ts`) sont maintenant mises en cache via `unstable_cache` (tags `products`/`categories`, 2-5 min), invalidées immédiatement par `revalidateTag` dans les actions admin — navigation à ~280ms sur cache chaud au lieu de plusieurs secondes. Le premier accès à une route en `next dev` reste plus lent (compilation à la demande, spécifique au mode développement) ; `next build` précompile tout, donc ce coût n'existe pas en production.
- Page d'accueil : le défilé horizontal (`ProductShowcase`) affiche désormais les vrais produits publiés (nom, image, lien vers la fiche produit) au lieu d'une liste statique des 6 catégories — tout nouveau produit publié en admin y apparaît automatiquement.
- ✅ **Correction dérive "générique IA" (catalogue + fiche produit)**, après audit comparatif contre A-COLD-WALL*, Bottega Veneta et Aesop :
  - Fond photo produit uniformisé (voir `studio` ci-dessus dans ART_DIRECTION.md) sur catalogue, fiche produit et défilé accueil.
  - Hiérarchie typographique à deux polices : `Fraunces` (éditorial) pour noms de produits et titres de section, `Anton` réservé au wordmark/nav/UI.
  - Fiche produit reconstruite : vrai nuancier (carré coloré + nom réel mesuré sur la photo, `lib/utils.ts:swatchColor`), taille en menu déroulant à côté d'un bouton "Ajouter au panier" de taille modeste (au lieu d'un gros bouton pleine largeur isolé), section "Détails" avec des faits réels et vérifiables uniquement (coupe, emplacement du logo, personnalisation — jamais de composition/grammage inventés, affiché "non communiqués par la marque"), section "Compléter la tenue" (cross-sell avec les autres produits réels publiés), tilt léger au survol de la galerie.
  - Personnalisation (nom/pseudo + aperçu) activée sur Polo, Chemise, Débardeur et Jogger en plus du T-shirt (n'était vraie que pour le T-shirt, ce qui la faisait paraître "absente" ailleurs) ; laissée désactivée sur la Casquette (n'a pas d'emplacement de personnalisation évident).
  - Rouge signature réintroduit sur catalogue/fiche produit (pastille de filtre catégorie active, bouton "Ajouter au panier", lueur au survol des cartes) — auparavant cantonné au hero.
- ✅ **Deuxième passe anti-générique** (connexion, checkout, états vides, pages légales) :
  - `/compte` et `/admin/login` : logo, titre éditorial, accents rouges au lieu du formulaire SaaS générique (onglets/champs/bouton blancs sans identité).
  - `/checkout` : indicateur d'étape en pastilles numérotées (rouge = complété) au lieu d'un simple texte "1. informations / 2. ...", titres éditoriaux par étape, CTA rouges. Pays par défaut corrigé en Côte d'Ivoire (était "France" — erreur de copier-coller du template initial) ; code postal rendu optionnel (non systématique en Côte d'Ivoire).
  - Panier/favoris/drops : nouveau composant `EmptyState` (filigrane du logo, titre éditorial, lien rouge) remplaçant le même rectangle bordé générique répété sur les trois pages.
  - Pages légales/service (`PlaceholderPage`) : même traitement filigrane + éditorial ; `/contact` affiche désormais un vrai canal de contact (WhatsApp) au lieu de "coordonnées à venir".
  - Bouton WhatsApp flottant global (`+225 07 75 85 367`, `wa.me/2250777585367`) ajouté au layout racine.
  - Nuancier produit désormais fonctionnel : cliquer une couleur change réellement la galerie photo affichée, pas seulement le prix/la taille — nouveau champ `ProductImage.color` (migration appliquée), backfillé sur les vraies photos par couleur du T-shirt (seul produit à ce jour avec plusieurs couleurs photographiées). Deux photos qui affichaient les noms d'exemple "LIONEL_k"/"BELLA_K" comme s'il s'agissait de vrais clients ont été retirées du catalogue (règle du brief sur les noms d'exemple des mockups).
  - Bug corrigé : erreur d'hydratation React systématique sur toutes les pages (`useCart`/`useWishlist`, stores zustand persistés en localStorage, se réhydrataient de façon synchrone avant que React ne compare au HTML serveur). Passage à `skipHydration: true` + réhydratation manuelle après montage (`components/providers/StoreHydration.tsx`).
- **Limite connue** : `tshirt-taupe/front-1.jpg` garde son fond marron d'origine (pas uniformisé) — l'ombre portée sur cette photo descend jusqu'à la couleur de fond exacte sur une zone large connectée au bord, ce qu'aucun seuil de chroma-key ne peut séparer sans un vrai matting ML. Documenté dans `scripts/neutralize-product-backgrounds.js`.
