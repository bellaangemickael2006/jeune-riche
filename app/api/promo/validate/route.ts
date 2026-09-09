import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolvePromoCode } from "@/lib/data/promoCodes";

const schema = z.object({ code: z.string().min(1), subtotal: z.number().nonnegative() });

// Aperçu uniquement — la remise réellement appliquée est recalculée et
// verrouillée côté serveur dans /api/checkout, jamais depuis cette réponse.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: "Requête invalide." }, { status: 400 });
  }

  const result = await resolvePromoCode(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result);
}
