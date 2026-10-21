import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolvePromoCode } from "@/lib/data/promoCodes";
import { rateLimit, clientIp } from "@/lib/rateLimit";

const schema = z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().nonnegative().max(100_000_000) });

// Aperçu uniquement — la remise réellement appliquée est recalculée et
// verrouillée côté serveur dans /api/checkout, jamais depuis cette réponse.
export async function POST(req: NextRequest) {
  // Endpoint public sans compte requis : sans limite, un script pourrait
  // essayer des codes en boucle jusqu'à en trouver un valide.
  if (!(await rateLimit(`promo-validate:${clientIp(req)}`, 20, 5 * 60_000))) {
    return NextResponse.json({ valid: false, message: "Trop de tentatives, réessayez dans un instant." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Requête invalide." }, { status: 400 });
  }

  const result = await resolvePromoCode(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result);
}
