import { NextResponse, type NextRequest } from "next/server";
import { getDropLive } from "@/lib/data/drops";

// Stock restant et ventes récentes d'un drop, interrogés en boucle par la
// page /drops/[slug]. Le cache partagé de 5 s vit dans getDropLive.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const live = await getDropLive(slug);
    if (!live) return NextResponse.json({ error: "Drop introuvable." }, { status: 404 });
    return NextResponse.json(live, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/drops/live]", error);
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
}
