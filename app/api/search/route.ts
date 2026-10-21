import { NextRequest, NextResponse } from "next/server";
import { getPublishedProducts } from "@/lib/data/products";
import { searchProducts, SEARCH_MAX_LENGTH } from "@/lib/catalogue/search";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export type SearchSuggestion = { slug: string; name: string; category: string; price: number | null; image: string | null };

const SUGGESTIONS = 6;

// Suggestions pendant la frappe (fenêtre de recherche du site). Lit les
// produits publiés déjà en cache : aucune requête en base par touche tapée.
export async function GET(req: NextRequest) {
  // Large : le navigateur n'appelle qu'après une courte pause dans la frappe.
  if (!(await rateLimit(`search:${clientIp(req)}`, 120, 60_000))) {
    return NextResponse.json({ suggestions: [] }, { status: 429 });
  }
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, SEARCH_MAX_LENGTH);
  const products = q.trim() ? searchProducts(await getPublishedProducts(), q, SUGGESTIONS) : [];
  const suggestions: SearchSuggestion[] = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category.name,
    price: p.price === null ? null : Number(p.price),
    image: p.images[0]?.url ?? null,
  }));
  return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "no-store" } });
}
