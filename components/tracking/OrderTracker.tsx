"use client";

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { trackOrder, type TrackOrderState, type TrackedOrder } from "@/lib/actions/tracking";
import { TRACKING_STEPS } from "@/lib/orders/tracking";
import { useLocale } from "@/components/providers/I18nProvider";
import { cn, formatPrice, WHATSAPP_NUMBER } from "@/lib/utils";

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

      {state?.ok && <TrackedOrderView order={state.order} />}
    </div>
  );
}

function TrackedOrderView({ order }: { order: TrackedOrder }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(iso));
  const helpLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("tracking.whatsappMessage", { number: order.orderNumber })
  )}`;

  return (
    <section aria-live="polite" className="mt-12 border-t border-line pt-10">
      <p className="text-label text-paper/40">{t("tracking.orderOf", { date: date(order.createdAt) })}</p>
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
