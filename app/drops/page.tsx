import type { Metadata } from "next";
import { getDrops } from "@/lib/data/drops";
import EmptyState from "@/components/ui/EmptyState";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { getDropCountdown } from "@/lib/utils";
import { getServerTranslation } from "@/lib/i18n/server";
import Link from "next/link";
import { after } from "next/server";
import { dropPhase, isDueToOpen } from "@/lib/drops/live";
import { announceOpenedDropsSafely } from "@/lib/drops/announce";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: t("drops.title"),
    description: t("drops.metaDescription"),
  };
}

export default async function DropsPage() {
  const { t, locale } = await getServerTranslation();
  const drops = await getDrops();
  if (drops.some((d) => isDueToOpen(d))) after(announceOpenedDropsSafely);

  const STATUS_LABEL: Record<string, string> = {
    COMING_SOON: t("drops.status.COMING_SOON"),
    PRE_ORDER: t("drops.status.PRE_ORDER"),
    AVAILABLE: t("drops.status.AVAILABLE"),
    SOLD_OUT: t("drops.status.SOLD_OUT"),
    ENDED: t("drops.status.ENDED"),
  };

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <h1 className="font-editorial text-4xl text-paper md:text-6xl">{t("drops.title")}</h1>

      {drops.length === 0 ? (
        <EmptyState message={t("drops.empty")} cta={{ label: t("common.viewCatalogue"), href: "/catalogue" }} />
      ) : (
        <ul className="mt-12 divide-y divide-line">
          {drops.map((d) => {
            const countdown = getDropCountdown(d);
            const isLive = dropPhase(d) === "live";
            return (
              <li key={d.id} className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link href={`/drops/${d.slug}`} className="group flex items-center gap-3">
                    <p className="font-display text-xl uppercase text-paper group-hover:underline">{d.name}</p>
                    {isLive && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest2 text-paper">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                        {t("drops.live.phase.live")}
                      </span>
                    )}
                  </Link>
                  {d.description && <p className="mt-1 max-w-md text-sm text-paper/50">{d.description}</p>}
                </div>
                <div className="flex items-center gap-4">
                  {countdown && <CountdownTimer target={countdown.target} labelKey={countdown.labelKey} />}
                  <span className="text-xs text-paper/40">{d.startsAt.toLocaleDateString(locale)}</span>
                  <span className="border border-line px-3 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
