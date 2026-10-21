"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trackOrder, type TrackOrderState, type TrackedOrder } from "@/lib/actions/tracking";
import { TRACKING_STEPS } from "@/lib/orders/tracking";
import { useLocale } from "@/components/providers/I18nProvider";
import { cn, formatPrice, WHATSAPP_NUMBER } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Relecture de secours si un signal temps réel se perd (réseau mobile instable).
const FALLBACK_REFRESH_MS = 60_000;

export default function OrderTracker({ initialNumber }: { initialNumber: string }) {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState<TrackOrderState, FormData>(trackOrder, null);

  return (
    <div className="mx-auto w-full max-w-xl">
      <form action={formAction} className="flex flex-col gap-3">
        <label className="block">
          <span className="mb-2 block text-label text-paper/50">{t("tracking.orderNumber")}</span>
          <input
            name="orderNumber"
            defaultValue={initialNumber}
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="JR-…"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm uppercase text-paper placeholder:text-paper/30 focus:border-paper focus:outline-hidden"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-label text-paper/50">{t("tracking.contact")}</span>
          <input
            name="contact"
            required
            autoComplete="email"
            placeholder={t("tracking.contactPlaceholder")}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-hidden"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-2 w-full bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-fit"
        >
          {pending ? t("tracking.searching") : t("tracking.submit")}
        </button>
        {state && !state.ok && (
          <p role="alert" className="text-sm text-paper/70">
            {t(`tracking.errors.${state.error}`)}
          </p>
        )}
      </form>

      {state?.ok && (
        <LiveTrackedOrder
          // Nouvelle recherche = nouveau suivi (autre commande ou jeton renouvelé).
          key={state.live?.token ?? state.order.orderNumber}
          initial={state.order}
          live={state.live}
        />
      )}
    </div>
  );
}

type LiveStatus = "connecting" | "live" | "expired" | "off";

/**
 * Commande affichée en direct : quand l'équipe la modifie dans l'admin, un
 * signal arrive sur le canal propre à cette commande et la page relit
 * aussitôt son état (voir lib/orders/liveTracking.ts). Rien d'autre sur le
 * site n'est concerné.
 */
function LiveTrackedOrder({ initial, live }: { initial: TrackedOrder; live: { token: string; channel: string } | null }) {
  const [order, setOrder] = useState(initial);
  const [status, setStatus] = useState<LiveStatus>(live ? "connecting" : "off");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!live) return;
    let stopped = false;

    async function refresh(fromSignal: boolean) {
      if (stopped) return;
      try {
        const res = await fetch(`/api/suivi?t=${encodeURIComponent(live!.token)}`, { cache: "no-store" });
        if (res.status === 401) {
          stopped = true;
          setStatus("expired");
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as { order?: TrackedOrder };
        if (!data.order || stopped) return;
        setOrder((previous) => {
          const changed = JSON.stringify(previous) !== JSON.stringify(data.order);
          if (changed || fromSignal) setUpdatedAt(Date.now());
          return changed ? data.order! : previous;
        });
      } catch {
        // Hors connexion : la prochaine relecture ou le prochain signal rattrapera.
      }
    }

    const supabase = createClient();
    const channel = supabase
      .channel(live.channel)
      .on("broadcast", { event: "update" }, () => refresh(true))
      .subscribe((s) => {
        if (stopped) return;
        if (s === "SUBSCRIBED") setStatus("live");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("connecting");
      });

    // Secours : relecture régulière tant que la page est visible, et dès
    // qu'on revient sur l'onglet (téléphone mis en veille, autre appli…).
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh(false);
    }, FALLBACK_REFRESH_MS);
    function onVisible() {
      if (document.visibilityState === "visible") refresh(false);
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      supabase.removeChannel(channel);
    };
  }, [live]);

  return <TrackedOrderView order={order} status={status} updatedAt={updatedAt} />;
}

function TrackedOrderView({ order, status, updatedAt }: { order: TrackedOrder; status: LiveStatus; updatedAt: number | null }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
  const helpLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("tracking.whatsappMessage", { number: order.orderNumber })
  )}`;

  return (
    <section aria-live="polite" className="mt-12 border-t border-line pt-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label text-paper/40">{t("tracking.orderOf", { date: date(order.createdAt) })}</p>
        {status === "live" && (
          <p className="flex items-center gap-2 text-label text-paper/60">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper" />
            {t("tracking.live")}
          </p>
        )}
      </div>
      {updatedAt && (
        <p key={updatedAt} role="status" className="mt-3 border border-paper/30 px-3 py-2 text-xs text-paper">
          {t("tracking.liveUpdated")}
        </p>
      )}
      {status === "expired" && <p className="mt-3 text-xs text-paper/50">{t("tracking.liveExpired")}</p>}
      <h2 className="mt-2 font-editorial text-heading text-paper">{order.orderNumber}</h2>

      {order.step === null ? (
        <p className="mt-6 border border-line px-4 py-3 text-sm text-paper/70">{t("tracking.cancelled")}</p>
      ) : (
        <ol className="mt-8 grid grid-cols-4 gap-2">
          {TRACKING_STEPS.map((step, i) => {
            const done = i <= (order.step ?? -1);
            const current = i === order.step;
            return (
              <li key={step} className="flex flex-col gap-3">
                <span
                  className={cn(
                    "h-1 w-full origin-left transition-colors duration-700",
                    done ? "bg-paper" : "bg-line"
                  )}
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                      done ? "border-paper bg-paper text-ink" : "border-line text-paper/30",
                      current && "animate-pulse"
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span className={cn("text-[11px] uppercase tracking-widest2", done ? "text-paper" : "text-paper/35")}>
                    {t(`tracking.steps.${step}`)}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.step !== null && (
        <p className="mt-6 text-sm text-paper/60">
          {t(`tracking.stepHint.${TRACKING_STEPS[order.step]}`)}{" "}
          <span className="text-paper/40">{t("tracking.updatedOn", { date: date(order.updatedAt) })}</span>
        </p>
      )}
      {order.trackingNumber && (
        <p className="mt-3 text-sm text-paper">
          {t("tracking.trackingNumber")} <span className="font-mono">{order.trackingNumber}</span>
        </p>
      )}

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-paper">
              {item.name} <span className="text-paper/40">— {item.color} / {item.size}</span>
            </span>
            <span className="text-paper/60">×{item.quantity}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-sm">
        <span className="text-paper/50">{t("checkout.total")}</span>
        <span className="text-paper">{formatPrice(order.total, locale)}</span>
      </p>

      <a
        href={helpLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 hover:text-paper/70"
      >
        {t("tracking.help")}
      </a>
    </section>
  );
}
