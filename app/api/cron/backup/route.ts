import { NextRequest, NextResponse } from "next/server";
import { runBackup } from "@/lib/backup/run";

// Sauvegarde quotidienne de la base (voir lib/backup/run.ts), déclenchée par
// Vercel Cron (vercel.json). Même protection que les autres crons :
// réservée à Vercel (CRON_SECRET).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const meta = await runBackup();
    return NextResponse.json({ ok: true, day: meta.day, chunks: meta.chunks, bytes: meta.bytes, missing: meta.missing });
  } catch (error) {
    console.error("[cron/backup]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
