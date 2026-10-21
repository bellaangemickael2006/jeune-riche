import { NextResponse, type NextRequest } from "next/server";
import { getAdminAccess } from "@/lib/auth";
import { logAdmin } from "@/lib/admin/audit";
import { isBackupDay } from "@/lib/backup/format";
import { loadBackup } from "@/lib/backup/run";

// Téléchargement d'une copie déchiffrée (JSON). Propriétaires uniquement :
// le fichier contient toutes les données des clients.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ day: string }> }) {
  const { user, isOwner } = await getAdminAccess();
  if (!isOwner) return NextResponse.json({ error: "Réservé au propriétaire." }, { status: 403 });

  const { day } = await params;
  if (!isBackupDay(day)) return NextResponse.json({ error: "Date invalide." }, { status: 400 });

  let json: string | null;
  try {
    json = await loadBackup(day);
  } catch (error) {
    console.error("[admin] téléchargement sauvegarde:", error);
    return NextResponse.json({ error: "Copie illisible ou Upstash indisponible." }, { status: 502 });
  }
  if (json === null) return NextResponse.json({ error: "Cette copie n'existe plus." }, { status: 404 });

  await logAdmin(user, "sauvegardes.telechargement", `Copie du ${day}`);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="jeune-riche-sauvegarde-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
