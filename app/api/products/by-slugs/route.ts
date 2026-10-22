import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProductsBySlugs } from "@/lib/data/products";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Favoris et panier relisent leurs produits ici. Bornes strictes : chaque
// liste distincte crée une entrée de cache, et des noms démesurés (150 Ko
// acceptés avant) occupaient la base plusieurs secondes.
const schema = z.object({ slugs: z.array(z.string().max(120)).max(100) });

export async function POST(req: NextRequest) {
  if (!(await rateLimit(`by-slugs:${clientIp(req)}`, 60, 60_000))) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const products = await getProductsBySlugs([...new Set(parsed.data.slugs)]);

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price ? Number(p.price) : null,
      personalizationEnabled: p.personalizationEnabled,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, type: i.type })),
      category: { name: p.category.name, slug: p.category.slug },
      variants: p.variants.map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock })),
      drop: p.drop,
    })),
  });
}
