# JEUNE RICHE — Tests

Aucune base Supabase n'étant encore provisionnée pendant cette session, la vérification a porté
sur : la compilation stricte, le build de production, et une inspection réelle dans un navigateur
(DOM, arbre d'accessibilité, requêtes réseau, console) plutôt que sur des captures d'écran —
la capture d'écran du panneau navigateur s'est révélée non fiable pendant cette session (voir
"Limites" ci-dessous), mais chaque page a été vérifiée via `read_page` / `get_page_text` /
`read_console_messages` / `read_network_requests`, qui reflètent l'état réel rendu par le navigateur.

## Vérifications automatiques

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ Aucune erreur |
| `npm run build` (Next.js 15.5.25) | ✅ 23 routes générées, aucune erreur de compilation |
| ESLint (`next/core-web-vitals`, `next/typescript`) | ✅ Configuré, aucune erreur bloquante |

## Vérifications manuelles (navigateur réel, serveur dev local)

| Page | Vérifié | Résultat |
|---|---|---|
| `/` (homepage) | Vidéo hero en lecture, nav, CTA, grille catégories (6/6 images 200 OK), teaser manifeste | ✅ |
| `/catalogue` | Filtres (6 catégories réelles + "Tout"), état vide honnête (aucun produit publié — DB non connectée) | ✅ |
| `/catalogue/produit-inexistant` | 404 → page not-found personnalisée (pas le 404 générique Next) | ✅ |
| `/manifeste` | Texte éditorial affiché, aucune donnée inventée | ✅ |
| `/admin` sans session | Redirection vers `/admin/login` | ✅ |
| `/admin` sans config Supabase | **Bug trouvé et corrigé** : crash 500 (`createServerClient` lève une exception si les variables d'env sont absentes) au lieu de rediriger proprement. Corrigé dans `lib/auth.ts` (vérification des variables d'env avant d'instancier le client Supabase) + message dédié sur `/admin/login`. Revérifié après correction : redirection propre avec message "Supabase n'est pas encore configuré". | ✅ après correction |
| `/admin/produits/nouveau` (build) | **Bug trouvé et corrigé** : le build échouait (page prérendue statiquement, appelait Prisma sans base disponible). Corrigé avec `export const dynamic = "force-dynamic"` sur le layout admin protégé + try/catch local. | ✅ après correction |
| Console navigateur | Aucune erreur JS non gérée après corrections (seules les erreurs Prisma attendues, journalisées volontairement via `console.error`, apparaissent tant que `DATABASE_URL` est absent) | ✅ |

## Non vérifié cette session (nécessite Supabase provisionné)

- Création de compte / connexion client.
- Ajout au panier → checkout → création réelle de commande en base → décrément de stock.
- Admin : création/édition de produit, gestion de stock, modération d'avis, changement de statut de commande — code écrit et relu, mais jamais exécuté contre une vraie base.
- Personnalisation : aperçu live vérifié visuellement dans le DOM (logique du composant), pas testé de bout en bout avec un ajout au panier réel faute de produits publiés.
- Responsive mobile réel (testé uniquement via lecture du DOM/CSS, pas de capture visuelle mobile).
- Performance (Core Web Vitals, Lighthouse) — non mesurée cette session.

## Limites rencontrées

- Les captures d'écran du panneau navigateur intégré sont revenues uniformément noires dès que le
  panneau n'était pas affiché côté client ("The Browser pane is currently hidden"), probablement
  lié à la vidéo `autoplay` en tâche de fond dans un panneau non composé à l'écran. L'inspection DOM
  (`read_page`, `get_page_text`, requêtes réseau, styles calculés via `javascript_tool`) a confirmé
  que le rendu réel était correct malgré des captures noires — mais une vérification visuelle par
  capture d'écran, panneau ouvert, reste recommandée avant mise en production.

## Prochaine session de test recommandée

1. Provisionner Supabase, migrer, seed, créer un admin (voir TODO.md).
2. Publier au moins un produit avec un vrai prix/stock.
3. Parcours complet : catalogue → produit → personnalisation → panier → checkout → confirmation → vérification dans `/admin/commandes`.
4. Ouvrir le panneau navigateur au premier plan et reprendre une vérification par capture d'écran (desktop + mobile) pour la direction artistique.
5. Introduire Playwright pour figer ces parcours en tests automatisés (`tests/`).
