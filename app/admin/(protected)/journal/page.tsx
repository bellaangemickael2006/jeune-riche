import Link from "next/link";
import type { Prisma } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AUDIT_SECTIONS, auditLabel, isSensitiveAction, parseJournalFilters } from "@/lib/admin/auditLabels";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Abidjan",
});

// Journal d'activité : qui a fait quoi dans l'admin, et quand. Réservé aux
// propriétaires — un employé ne peut ni le lire ni effacer ses traces.
export default async function AdminJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; qui?: string; page?: string }>;
}) {
  await requireAdmin("proprietaire");
  const { section, qui, page } = parseJournalFilters(await searchParams);

  const where: Prisma.AdminLogWhereInput = {
    ...(section ? { action: { startsWith: `${section}.` } } : {}),
    ...(qui ? { actorEmail: qui } : {}),
  };

  let logs;
  let people: string[] = [];
  try {
    [logs, people] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE + 1, // un de plus : y a-t-il une page suivante ?
      }),
      prisma.user
        .findMany({ where: { role: "ADMIN" }, select: { email: true }, orderBy: { email: "asc" } })
        .then((admins) => admins.map((a) => a.email.toLowerCase())),
    ]);
  } catch (error) {
    console.error("[admin] lecture journal:", error);
    logs = null; // table absente : migration à appliquer
  }

  const hasNext = logs ? logs.length > PAGE_SIZE : false;
  const rows = logs?.slice(0, PAGE_SIZE) ?? [];
  const href = (next: { section?: string | null; qui?: string | null; page?: number }) => {
    const params = new URLSearchParams();
    const s = next.section === undefined ? section : next.section;
    const q = next.qui === undefined ? qui : next.qui;
    if (s) params.set("section", s);
    if (q) params.set("qui", q);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return query ? `/admin/journal?${query}` : "/admin/journal";
  };

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl uppercase text-paper">Journal</h1>
      <p className="mt-2 text-sm text-paper/50">
        Toutes les actions faites dans l&apos;administration : qui, quoi, quand et depuis quelle adresse.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[[null, "Tout"] as const, ...Object.entries(AUDIT_SECTIONS)].map(([value, label]) => (
          <Link
            key={label}
            href={href({ section: value, page: 1 })}
            className={cn(
              "border px-3 py-1.5 text-[10px] uppercase tracking-widest2",
              section === value ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {people.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[null, ...people].map((email) => (
            <Link
              key={email ?? "tous"}
              href={href({ qui: email, page: 1 })}
              className={cn(
                "border px-3 py-1.5 text-[10px] tracking-wide",
                qui === email ? "border-paper bg-paper text-ink" : "border-line text-paper/60 hover:text-paper"
              )}
            >
              {email ?? "Toute l'équipe"}
            </Link>
          ))}
        </div>
      )}

      {logs === null ? (
        <p className="mt-8 border border-line p-4 text-sm text-paper/60">
          Journal indisponible : appliquez d&apos;abord la migration « add_admin_logs » dans Supabase.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucune action enregistrée{section || qui ? " pour ce filtre" : ""}.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {rows.map((log) => {
            const sensitive = isSensitiveAction(log.action);
            return (
              <li key={log.id} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <p className="text-xs text-paper/50">{dateFormat.format(log.createdAt)}</p>
                <div className="min-w-0">
                  <p className="text-sm text-paper">
                    <span className={cn("mr-2 text-[10px] uppercase tracking-widest2", sensitive ? "text-paper" : "text-paper/50")}>
                      {sensitive && "● "}
                      {auditLabel(log.action)}
                    </span>
                    <span className="break-words">{log.summary}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-paper/40">
                    {log.actorEmail}
                    {log.ip && ` · ${log.ip}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(page > 1 || hasNext) && (
        <div className="mt-6 flex justify-between text-[10px] uppercase tracking-widest2">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className="border border-line px-3 py-1.5 text-paper hover:border-paper">
              ← Plus récent
            </Link>
          ) : (
            <span />
          )}
          {hasNext && (
            <Link href={href({ page: page + 1 })} className="border border-line px-3 py-1.5 text-paper hover:border-paper">
              Plus ancien →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
