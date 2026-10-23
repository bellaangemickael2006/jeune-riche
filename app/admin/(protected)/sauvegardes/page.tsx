import { requireAdmin } from "@/lib/auth";
import { listBackups, type BackupMeta } from "@/lib/backup/run";
import { backupNow } from "@/lib/actions/backup";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Abidjan" });

function size(bytes: number) {
  return bytes < 1_000_000 ? `${Math.max(1, Math.round(bytes / 1000))} Ko` : `${(bytes / 1_000_000).toFixed(1)} Mo`;
}

// Copies quotidiennes de la base (lib/backup/run.ts), réservées aux
// propriétaires : elles contiennent toutes les données des clients.
export default async function AdminBackupsPage() {
  await requireAdmin("proprietaire");
  let backups: BackupMeta[] | null;
  try {
    backups = await listBackups();
  } catch (error) {
    console.error("[admin] liste des sauvegardes:", error);
    backups = null;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl uppercase text-paper">Sauvegardes</h1>
      <p className="mt-2 text-sm text-paper/70">
        Chaque nuit, une copie chiffrée de la boutique (commandes, clients, produits, stock, avis, codes promo,
        newsletter, réglages) est rangée chez Upstash, en dehors de Supabase. Les 14 dernières sont gardées.
      </p>

      <ActionForm action={backupNow} className="mt-6 flex flex-wrap items-center gap-4">
        <SubmitButton
          pendingLabel="Sauvegarde en cours…"
          className="border border-paper px-4 py-2 text-[11px] uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          Sauvegarder maintenant
        </SubmitButton>
      </ActionForm>

      {backups === null ? (
        <p className="mt-8 border border-line p-4 text-sm text-paper/60">Liste indisponible : Upstash ne répond pas.</p>
      ) : backups.length === 0 ? (
        <p className="mt-8 text-sm text-paper/60">Aucune copie pour l&apos;instant : la première sera faite cette nuit, ou maintenant avec le bouton.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {backups.map((b) => {
            const rows = Object.values(b.counts).reduce((sum, n) => sum + n, 0);
            return (
              <li key={b.day} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm text-paper first-letter:uppercase">{dateFormat.format(new Date(b.createdAt))}</p>
                  <p className="mt-1 text-xs text-paper/70">
                    {b.counts.order ?? 0} commandes · {b.counts.user ?? 0} comptes · {b.counts.product ?? 0} produits · {rows} lignes
                    au total · {size(b.bytes)}
                  </p>
                  {b.missing.length > 0 && (
                    <p className="mt-1 text-xs text-paper/60">Tables absentes de la base à ce moment : {b.missing.join(", ")}</p>
                  )}
                </div>
                {/* Lien de téléchargement direct (pas de navigation client) : réponse en fichier. */}
                <a
                  href={`/admin/sauvegardes/${b.day}`}
                  className="border border-line px-3 py-1.5 text-[11px] uppercase tracking-widest2 text-paper hover:border-paper"
                >
                  Télécharger
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-xs leading-relaxed text-paper/60">
        Le fichier téléchargé contient des données personnelles de clients : gardez-le en lieu sûr. Pas inclus : les
        photos et vidéos (déjà dans Supabase Storage) et les comptes de connexion. Restauration : voir README, section
        « Sauvegardes ».
      </p>
    </div>
  );
}
