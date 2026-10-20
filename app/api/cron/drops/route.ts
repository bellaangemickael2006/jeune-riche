import { NextRequest, NextResponse } from "next/server";
import { announceOpenedDrops } from "@/lib/drops/announce";

// Filet de sécurité quotidien (vercel.json) : ouvre et annonce un drop dont
// l'heure est passée sans qu'aucun visiteur ne l'ait déclenché. Même
// protection que le cron des paniers : réservé à Vercel (CRON_SECRET).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await announceOpenedDrops()) });
  } catch (error) {
    console.error("[cron/drops]", error);
    return NextResponse.json({ ok: false, opened: 0, sent: 0 });
  }
}
