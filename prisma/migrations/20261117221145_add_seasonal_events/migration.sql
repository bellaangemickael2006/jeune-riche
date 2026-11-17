-- CreateTable
CREATE TABLE IF NOT EXISTS "seasonal_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accent" TEXT NOT NULL DEFAULT '#C8102E',
    "bannerText" TEXT,
    "effectSnow" BOOLEAN NOT NULL DEFAULT false,
    "effectLights" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_events_pkey" PRIMARY KEY ("id")
);

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "seasonal_events" ENABLE ROW LEVEL SECURITY;
