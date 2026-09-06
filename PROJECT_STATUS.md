# JEUNE RICHE — État du projet

Dernière mise à jour : 2026-09-04 (session nocturne autonome).

## Ce qui est fait

**Étape 0 — Audit** ✅
- Inspection complète des 23 assets réels (logos, badges, 5 mockups t-shirt noir, 14 photos WhatsApp) et des 2 vidéos.
- Constat important : le dossier assets ne contient **pas** de vraie photo mannequin — uniquement des mockups produit sur fond studio/uni. Voir [ART_DIRECTION.md](ART_DIRECTION.md) §4.
- Aucune information légale/commerciale (prix, adresse, prestataire de paiement) n'était fournie — traité en état "à définir" partout, jamais inventé.

**Étape 1 — Direction artistique** ✅ — voir [ART_DIRECTION.md](ART_DIRECTION.md).

**Étape 2 — Fondations** ✅
- Next.js 15.5.25 (patch de sécurité — la 15.5.4 initiale avait une CVE critique), React 19, TypeScript strict, Tailwind CSS 3.
- Prisma configuré pour Supabase Postgres (`prisma/schema.prisma`) — 15 modèles (User, Product, ProductImage, ProductVariant, Category, Cart, CartItem, Order, OrderItem, Review, WishlistItem, RestockRequest, Drop, NewsletterSubscriber, SizeGuide).
- `@supabase/ssr` configuré (client + serveur + middleware de rafraîchissement de session).
- Design tokens Tailwind (noir/blanc/rouge + marine), polices Anton (display) / Fraunces (éditorial) / Inter (corps).
- Build de production vérifié (`npm run build` passe, TypeScript strict sans erreur).

**Étape 3 — Homepage** ✅
- Vidéo hero (`hero-production.mp4`) plein écran, autoplay/muted/loop/playsInline, fallback image si erreur de lecture.
- Intro cinématographique courte (logo, révélation par masque circulaire), une fois par session, bouton "Passer" visible immédiatement, respecte `prefers-reduced-motion`.
- Grille de catégories (6 catégories réelles) avec reveal en cascade, marquee de marque, teaser manifeste avec spotlight suivant le curseur.
- Curseur personnalisé (`mix-blend-mode: exclusion`, s'agrandit sur les éléments interactifs, désactivé sur tactile).
- Titre héros en word-pull-up, tagline en text-scramble, CTA magnétique, smooth scroll Lenis + GSAP ScrollTrigger enregistré globalement, grain cinématique en overlay, cartes produit avec tilt 3D + glow au survol.

**Étape 4 — Catalogue** ✅
- `/catalogue` avec filtres par catégorie (les 6 réelles), recherche par nom (`?q=`), état vide honnête si aucun produit publié.
- Grille éditoriale responsive, hover avec changement d'image.

**Étape 5 — Fiche produit** ✅
- `/catalogue/[slug]` : galerie (vignettes MOCKUP clairement étiquetées "référence de design"), sélection couleur/taille à partir des variantes réelles, personnalisation avec aperçu live + sanitation + limite de caractères, guide des tailles (masqué si aucune donnée), avis clients avec badge "Client vérifié" uniquement si `verifiedOrder`.
- Bouton "Me prévenir" (RestockRequest) quand une variante est en rupture.
- Favoris (`/favoris`) : liste persistante côté client (localStorage), toggle sur la fiche produit.

**Étape 6 — Panier** ✅
- Store Zustand persistant (localStorage), tiroir latéral + page `/panier` dédiée, personnalisation conservée par ligne d'article.

**Étape 7 — Checkout** ✅
- Tunnel en 3 étapes (informations → livraison → récapitulatif), création de commande réelle en base avec décrément de stock transactionnel, page de confirmation.
- **Aucun paiement réel** — le récapitulatif l'indique explicitement, en attendant le choix d'un prestataire (voir TODO).

**Étape 8 — Manifeste** ✅
- `/manifeste` avec la vidéo `manifeste-motif.mp4` en fond, texte éditorial court, aucune donnée inventée (pas d'historique, pas de chiffres).

**Étape 9 — Admin** ✅ (fonctionnel, non stylé à l'excès)
- Authentification Supabase + vérification du rôle ADMIN côté serveur (`requireAdmin`), redirection propre si Supabase n'est pas encore configuré.
- Dashboard avec vrais compteurs (0 par défaut, jamais de chiffre inventé).
- Produits : liste, création, édition (infos, variantes avec stock, images par URL/type FRONT-BACK-DETAIL-LIFESTYLE-MOCKUP), publication.
- Commandes : liste, détail, changement de statut.
- Avis : modération (approuver/refuser).
- Drops : liste + création simple.
- Newsletter : liste des abonnés. Clients : liste.

**Étape 10-11 — Finition / Performance** — largement fait (voir TODO pour le reste) : états vides partout, `prefers-reduced-motion` respecté partout (composants d'animation dédiés), images via `next/image`, vidéos servies en statique (pas de fonction serverless), micro-interactions (curseur, magnet, tilt, spotlight, grain, marquee) branchées sur l'accueil et le manifeste. Reste : sticky stacking (pas de contenu "drop" pour le justifier), post-processing 3D.

**Étape 12 — QA** — partiellement fait. Build de production vérifié. Navigation testée via navigateur réel (DOM/accessibilité/réseau/console) : homepage, catalogue (état vide), fiche produit (404 propre), manifeste, admin (redirection de sécurité). Voir [TESTS.md](TESTS.md) pour le détail et les limites rencontrées.

## Supabase — provisionné

Projet dédié `jeune-riche-ecommerce` créé (org `jeuneriche`, eu-west-1), migrations appliquées,
seed exécuté, variables d'environnement configurées en local et sur Vercel (Production). Voir
TODO.md pour l'historique complet et la création du premier compte admin.

## Ce qui reste — voir [TODO.md](TODO.md)

Le plus important maintenant : créer un premier compte admin (inscription + promotion manuelle en
base), puis saisir de vrais prix/stocks pour publier les 6 produits.
