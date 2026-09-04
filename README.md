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

Voir [TESTS.md](TESTS.md). Pas encore de suite Playwright automatisée — à ajouter (voir TODO.md).
