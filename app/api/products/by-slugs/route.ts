import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProductsBySlugs } from "@/lib/data/products";

const schema = z.object({ slugs: z.array(z.string()).max(100) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const products = await getProductsBySlugs(parsed.data.slugs);

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
