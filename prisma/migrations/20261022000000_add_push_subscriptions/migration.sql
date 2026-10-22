-- Abonnements aux notifications (Web Push) des clients.
-- Rejouable sans erreur (IF NOT EXISTS) : peut être collée telle quelle dans
-- l'éditeur SQL de Supabase, puis `prisma migrate deploy` ne la cassera pas.

-- CreateTable
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_scope_key" ON "push_subscriptions"("endpoint", "scope");
CREATE INDEX IF NOT EXISTS "push_subscriptions_scope_idx" ON "push_subscriptions"("scope");

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;
