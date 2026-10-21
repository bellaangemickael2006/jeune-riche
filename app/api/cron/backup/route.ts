import { NextRequest, NextResponse } from "next/server";
import { runBackup } from "@/lib/backup/run";
import { ensureMediaBucket } from "@/lib/storage";

// Entretien de nuit, déclenché par Vercel Cron (vercel.json) :
//  - sauvegarde de la base (voir lib/backup/run.ts) ;
//  - réapplication des règles du stockage de fichiers (types autorisés,
//    taille maximale, voir lib/storage.ts), pour qu'elles soient en place
//    même si personne n'a envoyé de fichier depuis le dernier déploiement.
// Même protection que les autres crons : réservée à Vercel (CRON_SECRET).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let storageRules = true;
  try {
    await ensureMediaBucket();
  } catch (error) {
    console.error("[cron/backup] règles du stockage:", error);
    storageRules = false;
  }

  try {
    const meta = await runBackup();
    return NextResponse.json({ ok: true, day: meta.day, chunks: meta.chunks, bytes: meta.bytes, missing: meta.missing, storageRules });
  } catch (error) {
    console.error("[cron/backup]", error);
    return NextResponse.json({ ok: false, storageRules }, { status: 500 });
  }
}
