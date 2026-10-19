-- Droits des employés de l'administration.
-- Rejouable sans erreur (IF NOT EXISTS) : peut être collée telle quelle dans
-- l'éditeur SQL de Supabase, puis `prisma migrate deploy` ne la cassera pas.

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin_permissions" (
    "userId" TEXT NOT NULL,
    "permissions" TEXT[],
    "invitedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_permissions_userId_fkey') THEN
        ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "admin_permissions" ENABLE ROW LEVEL SECURITY;
