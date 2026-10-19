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
