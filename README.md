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

### Emails automatiques

- **Rappel de panier** : uniquement si le client coche « M'envoyer un rappel » au checkout
  (décochée par défaut, vérifié aussi côté serveur). Chaque rappel contient un lien signé
  « Ne plus recevoir de rappel ».
- **Ouverture d'un drop** : à l'heure de début, le drop passe tout seul en « Disponible » et
  la liste newsletter reçoit une annonce, une seule fois. Déclenché par le premier visiteur
  présent (page /drops, page du drop) et au plus tard par le cron quotidien `/api/cron/drops`.
- Les campagnes et annonces contiennent un lien « Se désinscrire » signé (`AUTH_SECRET`).
- Gmail limite l'envoi à environ 500 emails par jour : au-delà, passer à un service d'envoi
  (Resend, Brevo…).

Les vidéos (`public/video/*.mp4` : manifeste en 1,9 Mo / 1,1 Mo sur téléphone ; `hero-production.mp4`, 20 Mo, n'est plus affichée) sont servies comme assets statiques Next.js —
elles ne transitent jamais par une fonction serverless. Pour un trafic important, migrer vers un
stockage/CDN dédié (Supabase Storage ou équivalent) est recommandé — voir TODO.md.

## Double vérification de l'admin

Après le mot de passe, chaque membre de l'équipe tape un code à 6 chiffres (Google Authenticator,
Microsoft Authenticator…). À la première connexion, le site demande d'enregistrer un téléphone
(QR code). Raison : la connexion par mot de passe de Supabase peut être appelée directement, sans
passer par la page de connexion ni son frein anti-essais ; un mot de passe deviné ne suffit donc plus.

- **Téléphone perdu (un membre)** : un propriétaire clique « Réinitialiser la double vérification »
  dans Admin → Équipe ; un nouveau téléphone sera demandé à la prochaine connexion.
- **Téléphone perdu (seul propriétaire)** : Supabase → Authentication → Users → le compte → supprimer
  le facteur MFA. Ou réinstaller le code avec la clé texte notée lors de l'enregistrement.
- **Secours** : `ADMIN_MFA=off` sur Vercel désactive la vérification (par exemple si l'option TOTP
  était coupée dans Supabase → Authentication → Multi-Factor). À retirer aussitôt après.

## Sauvegardes

Chaque nuit à 3 h (UTC), `/api/cron/backup` copie toutes les données de la boutique (commandes,
clients, produits, stock, avis, codes promo, newsletter, réglages, journal de l'admin) chez
**Upstash**, un autre prestataire que Supabase. La copie est compressée puis chiffrée (AES-256-GCM,
clé dérivée de `CRON_SECRET`) ; les 14 dernières sont gardées.

- Admin → **Sauvegardes** (propriétaires) : liste, « Sauvegarder maintenant », téléchargement en JSON.
- Pas inclus : les fichiers (photos, vidéos, modèles 3D, dans Supabase Storage) et les comptes de
  connexion Supabase (un client Google se reconnecte simplement).
- Changer `CRON_SECRET` rend les copies existantes illisibles : en refaire une juste après.

Restauration dans une base **vide** (nouveau projet Supabase, schéma créé par `npm run db:deploy`) :

```bash
npx tsx scripts/restore-backup.ts jeune-riche-sauvegarde-AAAA-MM-JJ.json
npx tsx scripts/restore-backup.ts jeune-riche-sauvegarde-AAAA-MM-JJ.json --confirmer
```

La première commande affiche seulement ce qui serait restauré ; la seconde écrit dans la base
désignée par `DIRECT_URL` (fichier `.env`). Les lignes déjà présentes ne sont jamais écrasées.

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
