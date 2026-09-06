# JEUNE RICHE — TODO

## Bloquant pour un premier déploiement réel

1. ✅ **Projet Supabase créé** : `jeune-riche-ecommerce` (org `jeuneriche`, région eu-west-1). Un premier projet réutilisé par erreur ("jeuneriche projet") contenait déjà des données réelles d'une tout autre activité (contacts/formations) — abandonné intact, jamais touché, pour ne rien écraser.
2. ✅ **Migrations appliquées** (`20260906133710_init`) sur la base réelle.
3. ✅ **Seed de développement exécuté** — 6 catégories et 6 produits réels créés, non publiés, prix à définir.
4. ✅ **Variables d'environnement configurées** dans `.env.local`/`.env` (local) et sur Vercel (Production) : `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
5. **Créer un compte admin** : s'inscrire via `/compte` sur le site, puis en base :
   ```sql
   update users set role = 'ADMIN' where email = '<email utilisé à l inscription>';
   ```
6. **Saisir les vrais prix et stocks** dans `/admin/produits`, puis publier chaque produit.
7. **Choisir et intégrer un prestataire de paiement** (Stripe ou solution locale) — le tunnel de checkout crée aujourd'hui la commande sans encaisser, ce qui est explicitement indiqué au client. Ne jamais afficher "paiement sécurisé" tant que ce n'est pas branché.

## Assets manquants (documenté, non inventé)

- **Aucune photo mannequin réelle.** Tous les produits utilisent des mockups (TSHIRT1-6, photos WhatsApp) comme référence de design. L'architecture `ProductImage.type` (FRONT/BACK/DETAIL/LIFESTYLE/MOCKUP) est prête à recevoir de vraies photos de campagne depuis `/admin/produits/[id]` sans changement de code.
- Le t-shirt taupe/marron manque de photo dos (`BACK`) — seules 3 vues face existent.
- **Logos non détourés** : `logo-black-on-white.png` et `logo-white-on-black.png` ont un fond plein, pas de transparence. Idéal : versions PNG transparentes pour un usage flexible (favicon, superpositions).
- Poster/thumbnail statique des deux vidéos (pour le fallback avant lecture) — actuellement le fallback utilise l'image badge, pas une vraie frame vidéo extraite.

## Informations commerciales manquantes (jamais inventées, à fournir)

- Prix réels de chaque produit.
- Politique de livraison et de retours réelles (`/livraison`, `/retours` n'existent pas encore).
- Coordonnées de contact réelles (`/contact` n'existe pas encore).
- CGV / politique de confidentialité réelles (`/conditions`, `/confidentialite` n'existent pas encore).
- Grille tarifaire de livraison (actuellement `shippingCost = 0` par défaut dans `/api/checkout`).
- Guide des tailles réel (mesures) — aucun `SizeGuide` n'est seedé, le composant reste masqué tant qu'aucune donnée n'existe.

## Fonctionnalités prévues par le brief mais non implémentées cette session

- Upload d'image direct (Supabase Storage) — l'admin ajoute une image par URL/chemin pour l'instant.
- Favoris : implémentés côté client (`/favoris`, bouton sur la fiche produit, persistant en localStorage). Le modèle `WishlistItem` existe en base pour une synchronisation par compte, non branchée — pour l'instant les favoris sont liés à l'appareil, pas au compte.
- Compte client (`/compte`) : inscription, connexion et historique de commandes réels (Supabase Auth). Non testé de bout en bout faute de projet Supabase provisionné cette session.
- `/drops` affiche les vrais drops en base (vide pour l'instant) ; `/a-propos`, `/livraison`, `/retours`, `/contact`, `/conditions`, `/confidentialite` existent en placeholders honnêtes ("à venir") plutôt qu'en 404 — contenu réel à fournir avant l'ouverture des ventes.
- Multilingue FR/EN (architecture non démarrée).
- Multi-devise (architecture non démarrée).
- Carte cadeau (hors scope tant que non demandé explicitement).
- Scène 3D (three.js/R3F installé mais non utilisé) — à réserver à un usage ciblé (ex. logo hero) une fois la base fonctionnelle validée, jamais au détriment de la performance.
- GSAP/ScrollTrigger, Lenis — dépendances installées, non branchées ; les animations actuelles utilisent Framer Motion + CSS.
- Sticky stacking, marquee, spotlight — non implémentés (finition, étape 10).
- Tests automatisés : scaffold Playwright ajouté (`playwright.config.ts`, `tests/navigation.spec.ts`) couvrant les parcours vérifiables sans base de données (navigation, états vides, 404, redirection admin). À étendre avec des parcours commerce réels (`tests/commerce.spec.ts`) une fois Supabase provisionné et au moins un produit publié.
- Grain/bloom cinématographique — non ajouté.

## Dette technique connue

- `npm audit` signale des vulnérabilités dans des dépendances transitives (à revérifier avant mise en production, `npm audit fix` sans `--force` d'abord).
- Le build affiche des logs `prisma:error` bruyants pendant `next build` quand `DATABASE_URL` est absent (comportement attendu et sans échec de build, mais à nettoyer si ça gêne le CI).
- Pas de rate limiting sur les routes API (`/api/checkout`, `/api/newsletter`, `/api/restock`) — à ajouter avant la production (ex. Upstash Ratelimit).
