-- Migrations en attente pour la base de production (Supabase → SQL Editor → coller → Run).
-- Chaque bloc est rejouable sans erreur : sans danger s'il est exécuté deux fois.
-- Ordre : photos d'avis, modèles 3D, historique de stock, droits de l'équipe.

-- ===== 20261019000000_add_review_photos =====
-- Photos jointes aux avis clients.
-- Rejouable sans erreur (IF NOT EXISTS) : peut être collée telle quelle dans
-- l'éditeur SQL de Supabase, puis `prisma migrate deploy` ne la cassera pas.

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_photos" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "review_photos_reviewId_idx" ON "review_photos"("reviewId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_photos_reviewId_fkey') THEN
        ALTER TABLE "review_photos" ADD CONSTRAINT "review_photos_reviewId_fkey"
            FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "review_photos" ENABLE ROW LEVEL SECURITY;

-- ===== 20261019120000_add_product_models =====
-- Modèles 3D (.glb) des produits, exportés depuis VirtualThreads.
-- Rejouable sans erreur (IF NOT EXISTS) : peut être collée telle quelle dans
-- l'éditeur SQL de Supabase, puis `prisma migrate deploy` ne la cassera pas.

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_models" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_models_productId_idx" ON "product_models"("productId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_models_productId_fkey') THEN
        ALTER TABLE "product_models" ADD CONSTRAINT "product_models_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "product_models" ENABLE ROW LEVEL SECURITY;

-- ===== 20261020000000_add_stock_movements =====
-- Historique des mouvements de stock.
-- Rejouable sans erreur (IF NOT EXISTS) : peut être collée telle quelle dans
-- l'éditeur SQL de Supabase, puis `prisma migrate deploy` ne la cassera pas.

-- CreateTable
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "orderId" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_variantId_fkey') THEN
        ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variantId_fkey"
            FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Comme toutes les tables de la boutique : RLS actif, sans règle. L'API
-- publique Supabase (clé anon) n'y a donc aucun accès ; le site passe par
-- Prisma (rôle propriétaire), qui n'est pas concerné.
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;

-- ===== 20261020010000_add_admin_permissions =====
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
