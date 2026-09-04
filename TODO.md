# JEUNE RICHE — TODO

## Bloquant pour un premier déploiement réel

1. **Créer le projet Supabase** (Postgres + Auth) et remplir `.env.local` à partir de `.env.example`.
2. **Exécuter les migrations** : `npx prisma migrate dev --name init`.
3. **Exécuter le seed de développement** : `npm run seed` (crée les 6 catégories et les 6 produits réels, non publiés, prix à définir — voir `prisma/seed.ts`).
4. **Créer un compte admin** : s'inscrire via Supabase Auth (ou `supabase.auth.admin.createUser`), puis en base :
   ```sql
   insert into users (id, "supabaseId", email, role)
   values (gen_random_uuid(), '<uuid Supabase Auth>', '<email>', 'ADMIN');
   ```
5. **Saisir les vrais prix et stocks** dans `/admin/produits`, puis publier chaque produit.
6. **Choisir et intégrer un prestataire de paiement** (Stripe ou solution locale) — le tunnel de checkout crée aujourd'hui la commande sans encaisser, ce qui est explicitement indiqué au client. Ne jamais afficher "paiement sécurisé" tant que ce n'est pas branché.

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
- Wishlist / favoris (modèle `WishlistItem` prêt en base, pas d'UI).
- Compte client (`/compte`) — page placeholder honnête créée, inscription/connexion client réelles pas encore construites (seul l'admin a une authentification Supabase fonctionnelle pour l'instant).
- `/drops` affiche les vrais drops en base (vide pour l'instant) ; `/a-propos`, `/livraison`, `/retours`, `/contact`, `/conditions`, `/confidentialite` existent en placeholders honnêtes ("à venir") plutôt qu'en 404 — contenu réel à fournir avant l'ouverture des ventes.
- Multilingue FR/EN (architecture non démarrée).
- Multi-devise (architecture non démarrée).
- Carte cadeau (hors scope tant que non demandé explicitement).
- Scène 3D (three.js/R3F installé mais non utilisé) — à réserver à un usage ciblé (ex. logo hero) une fois la base fonctionnelle validée, jamais au détriment de la performance.
- GSAP/ScrollTrigger, Lenis — dépendances installées, non branchées ; les animations actuelles utilisent Framer Motion + CSS.
- Sticky stacking, marquee, spotlight — non implémentés (finition, étape 10).
- Tests automatisés (Playwright) — pas encore de suite ; voir TESTS.md pour la méthode de vérification manuelle utilisée cette session.
- Grain/bloom cinématographique — non ajouté.

## Dette technique connue

- `npm audit` signale des vulnérabilités dans des dépendances transitives (à revérifier avant mise en production, `npm audit fix` sans `--force` d'abord).
- Le build affiche des logs `prisma:error` bruyants pendant `next build` quand `DATABASE_URL` est absent (comportement attendu et sans échec de build, mais à nettoyer si ça gêne le CI).
- Pas de rate limiting sur les routes API (`/api/checkout`, `/api/newsletter`, `/api/restock`) — à ajouter avant la production (ex. Upstash Ratelimit).
