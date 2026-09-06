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
- Scène 3D (three.js/R3F installé mais non utilisé) — à réserver à un usage ciblé (ex. logo hero) une fois la base fonctionnelle validée, jamais au détriment de la performance.
- ✅ Lenis (smooth scroll) + GSAP (ScrollTrigger enregistré, prêt pour du scroll complexe) branchés globalement.
- ✅ Marquee, spotlight (curseur), grain cinématique, curseur magnétique, tilt 3D sur les cartes produit, word-pull-up, text-scramble, masque circulaire à l'intro — tous implémentés (`components/ui/*`).
- Sticky stacking — non implémenté (pas encore de contenu réel type "pièce phare/drop" pour le justifier ; à faire quand un drop existera).
- Bloom/post-processing 3D (`@react-three/postprocessing`) — non ajouté, réservé à un usage ciblé futur (voir scène 3D ci-dessus).
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
