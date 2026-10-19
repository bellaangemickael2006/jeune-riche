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
