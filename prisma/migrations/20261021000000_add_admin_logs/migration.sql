-- Journal d'activité de l'administration.
-- Rejouable sans erreur (IF NOT EXISTS) : peut être collée telle quelle dans
-- l'éditeur SQL de Supabase, puis `prisma migrate deploy` ne la cassera pas.

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "target" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "admin_logs_action_createdAt_idx" ON "admin_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "admin_logs_actorEmail_createdAt_idx" ON "admin_logs"("actorEmail", "createdAt");

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "admin_logs" ENABLE ROW LEVEL SECURITY;
