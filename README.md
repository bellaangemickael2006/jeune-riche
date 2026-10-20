# JEUNE RICHE

Site officiel de la marque JEUNE RICHE — Next.js 15, Prisma, Supabase, Vercel.

Voir aussi : [ART_DIRECTION.md](ART_DIRECTION.md) (direction artistique) ·
[PROJECT_STATUS.md](PROJECT_STATUS.md) (état d'avancement) · [TODO.md](TODO.md) (reste à faire) ·
[TESTS.md](TESTS.md) (vérifications effectuées).

## Stack

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS
- **Animation** : Framer Motion (UI), GSAP + Lenis (installés, prêts pour le scroll avancé)
- **3D** : three.js / React Three Fiber (installé, non branché — voir TODO)
- **Données** : Prisma → Supabase PostgreSQL
- **Auth** : Supabase Auth (`@supabase/ssr`)
- **Hébergement cible** : Vercel (app) + Supabase (DB/Auth/Storage)

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis remplir avec vos identifiants Supabase
npx prisma migrate dev --name init
npm run seed                 # données de développement uniquement — jamais en production
npm run dev
```

Le site tourne sur http://localhost:3000. L'admin est sur http://localhost:3000/admin
(nécessite un compte Supabase promu ADMIN — voir TODO.md).

## Variables d'environnement

Voir `.env.example` pour la liste complète. Ne jamais committer `.env.local`. En résumé :

| Variable | Usage |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Connexion Prisma → Supabase Postgres (pooler / directe) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase (navigateur + serveur) |
| `SUPABASE_SERVICE_ROLE_KEY` | Opérations serveur privilégiées (jamais exposée au client) |
| `AUTH_SECRET` | Secret applicatif |
| `NEXT_PUBLIC_SITE_URL` | Base URL pour metadata, sitemap, Open Graph |

## Prisma

```bash
npm run prisma:generate   # régénère le client après modification du schéma
npm run prisma:migrate    # crée/applique une migration en dev
npm run prisma:studio     # explorateur de données
```

Le schéma est dans `prisma/schema.prisma`. Les migrations sont versionnées dans
`prisma/migrations/` — vérifier toujours l'impact d'une migration destructive avant de l'appliquer.

## Seed de développement

`prisma/seed.ts` crée les 6 catégories et les 6 produits réels identifiés dans les assets
(t-shirt, polo, chemise, débardeur, jogger, casquette), avec les vraies images de `public/images`.
**Prix et stock ne sont jamais inventés** : les produits sont créés en brouillon (`DRAFT`,
`published: false`), prix `null`, stock `0`. Un admin doit saisir des valeurs réelles avant de
publier. Ce seed ne doit jamais tourner automatiquement en production.

## Build & déploiement

```bash
npm run build
npm run start   # sert le build de production en local
```

Déploiement cible : push sur GitHub → Vercel (build automatique) → variables d'environnement
renseignées séparément pour Development / Preview / Production dans le dashboard Vercel, et projet
Supabase dédié par environnement si possible.

Le build **n'applique plus les migrations**. Après tout changement de `prisma/schema.prisma`,
appliquer la migration sur la base de production avec son URL :

```bash
npm run db:deploy
```

### Mode démo

Admin → Paramètres → « Mode démo — formater les données » : efface au choix les commandes et
l'activité, les abonnés, les comptes clients, le catalogue, ou remet les stocks à 0. Les comptes
admin, les catégories et les paramètres ne sont jamais touchés. Il faut taper `FORMATER` pour
confirmer : l'action est définitive.

### Connexion avec Google

Le bouton « Continuer avec Google » (page /compte) n'apparaît qu'une fois Google activé dans
Supabase :

1. Google Cloud Console → API et services → Écran de consentement OAuth : type « Externe », nom
   de l'application JEUNE RICHE, logo, email d'assistance, domaine du site.
2. Identifiants → Créer un ID client OAuth → « Application Web ». URI de redirection autorisé :
   `https://<projet>.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → Providers → Google : activer, coller l'ID client et le secret.
4. Supabase → Authentication → URL Configuration : Site URL = le domaine du site ; Redirect URLs :
   `https://<domaine>/auth/callback` (et `http://localhost:3000/auth/callback` pour le dev).

À la première connexion Google, `app/auth/callback` crée la fiche client (ou la rattache au
compte client existant ayant le même email). Un compte administrateur ne s'ouvre jamais par Google.

Les vidéos (`public/video/*.mp4`, ~20 Mo et ~11 Mo) sont servies comme assets statiques Next.js —
elles ne transitent jamais par une fonction serverless. Pour un trafic important, migrer vers un
stockage/CDN dédié (Supabase Storage ou équivalent) est recommandé — voir TODO.md.

## Structure

```text
app/            routes (App Router) — pages publiques, /admin, /api
components/     UI par domaine (home, catalogue, product, cart, admin, layout, ui)
lib/            accès données (Prisma), Supabase, actions serveur, utilitaires
prisma/         schema.prisma, migrations, seed.ts
public/         assets réels (images, vidéos) organisés par nature
store/          état client (panier, Zustand)
types/          types partagés
```

## Tests

```bash
npm test                          # tests unitaires (montants, emails, saisies admin)
npx playwright install chromium   # une seule fois
npm run test:e2e                  # lance le serveur dev et exécute la suite
```

La CI GitHub (`.github/workflows/ci.yml`) lance typecheck, lint, tests unitaires, build et les
tests de navigation à chaque push.

`tests/navigation.spec.ts` couvre les parcours qui ne dépendent pas d'une base de données
(navigation, états vides honnêtes, 404, redirection admin). Voir [TESTS.md](TESTS.md) pour le
détail des vérifications effectuées et ce qui reste à couvrir une fois Supabase provisionné.
