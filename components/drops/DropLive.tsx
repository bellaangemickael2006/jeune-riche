"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import { dropPhase, minutesAgo, type DropPhase } from "@/lib/drops/live";
import { useLocale } from "@/components/providers/I18nProvider";
import type { DropLiveData } from "@/lib/data/drops";

export type DropPiece = {
  id: string;
  slug: string;
  name: string;
  price: number | null;
  image: { url: string; alt: string } | null;
};

const POLL_MS = 10_000;
const LOW_STOCK = 10;

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** Nombre de personnes sur la page du drop, via Supabase Realtime (Presence). */
function useViewers(slug: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
    const supabase = createClient();
    const channel = supabase.channel(`drop:${slug}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });
    channel
      .on("presence", { event: "sync" }, () => setCount(Object.keys(channel.presenceState()).length))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ since: Date.now() });
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug]);
  return count;
}

export default function DropLive({
  slug,
  name,
  description,
  pieces,
  initial,
  initialPhase,
}: {
  slug: string;
  name: string;
  description: string | null;
  pieces: DropPiece[];
  initial: DropLiveData;
  /** Phase calculée par le serveur, utilisée jusqu'au montage (même rendu des deux côtés). */
  initialPhase: DropPhase;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [live, setLive] = useState(initial);
  // Heure du client, rafraîchie chaque seconde une fois monté (le rendu
  // serveur et la première hydratation utilisent la même valeur figée).
  const [now, setNow] = useState<number | null>(null);
  const viewers = useViewers(slug);
  // Stock au chargement de la page : référence fixe pour la jauge qui descend.
  const [startStock] = useState(initial.stock);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase: DropPhase = now === null ? initialPhase : dropPhase(live, now);

  // Stock et ventes en direct : toutes les 10 s, en pause quand l'onglet est
  // caché, et tout de suite au moment de l'ouverture.
  useEffect(() => {
    let stopped = false;
    async function refresh() {
      if (document.hidden) return;
      const res = await fetch(`/api/drops/${encodeURIComponent(slug)}/live`, { cache: "no-store" }).catch(() => null);
      if (!stopped && res?.ok) setLive((await res.json()) as DropLiveData);
    }
    const id = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [slug]);

  const wasUpcoming = useRef(phase === "upcoming");
  const [justOpened, setJustOpened] = useState(false);
  useEffect(() => {
    if (wasUpcoming.current && phase === "live") {
      wasUpcoming.current = false;
      setJustOpened(true);
      fetch(`/api/drops/${encodeURIComponent(slug)}/live`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setLive(data))
        .catch(() => {});
      const id = setTimeout(() => setJustOpened(false), 6000);
      return () => clearTimeout(id);
    }
  }, [phase, slug]);

  const target = phase === "upcoming" ? live.startsAt : phase === "live" ? live.endsAt : null;
  const remaining = target && now !== null ? new Date(target).getTime() - now : null;
  const allSoldOut = pieces.length > 0 && pieces.every((p) => (live.stock[p.id] ?? 0) === 0);

  return (
    <div className="min-h-screen bg-ink">
      <section className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-32 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <PhaseBadge phase={allSoldOut && phase === "live" ? "soldout" : phase} />
          {viewers >= 2 && (
            <span className="border border-line px-3 py-1 text-[10px] uppercase tracking-widest2 text-paper/70">
              {t("drops.live.viewers", { count: viewers })}
            </span>
          )}
        </div>
        <h1 className="mt-6 font-display text-[16vw] uppercase leading-[0.85] text-paper md:text-[9vw]">{name}</h1>
        {description && <p className="mx-auto mt-6 max-w-xl text-body text-paper/60">{description}</p>}

        {remaining !== null && remaining > 0 && (
          <div className="mt-10">
            <p className="text-label text-paper/50">
              {phase === "upcoming" ? t("drops.live.opensIn") : t("drops.countdown.endsIn")}
            </p>
            <BigCountdown ms={remaining} big={phase === "upcoming"} />
          </div>
        )}

        {phase === "upcoming" && <NotifyForm />}
        {phase === "ended" && <p className="mt-10 text-sm text-paper/50">{t("drops.live.ended")}</p>}
        {phase !== "upcoming" && allSoldOut && <p className="mt-10 text-sm text-paper/50">{t("drops.live.allGone")}</p>}

        <AnimatePresence>
          {justOpened && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-10 bg-paper px-6 py-3 font-display text-2xl uppercase text-ink"
            >
              {t("drops.live.openNow")}
            </motion.p>
          )}
        </AnimatePresence>
      </section>

      {pieces.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-24 md:px-10">
          <h2 className="text-label text-paper/50">{t("drops.live.pieces")}</h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3">
            {pieces.map((p) => (
              <PieceCard
                key={p.id}
                piece={p}
                hidden={phase === "upcoming"}
                stock={live.stock[p.id] ?? 0}
                startStock={startStock[p.id] ?? 0}
                locale={locale}
              />
            ))}
          </ul>
        </section>
      )}

      <RecentSaleToast sales={live.recentSales} now={now} />

      <div className="px-5 pb-16 text-center">
        <Link href="/drops" className="text-xs uppercase tracking-widest2 text-paper/50 underline underline-offset-4 hover:text-paper">
          ← {t("drops.live.allDrops")}
        </Link>
      </div>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: DropPhase }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2 border border-line px-3 py-1 text-[10px] uppercase tracking-widest2 text-paper">
      {phase === "live" && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
      {t(`drops.live.phase.${phase}`)}
    </span>
  );
}

function BigCountdown({ ms, big }: { ms: number; big: boolean }) {
  const { t } = useTranslation();
  const { days, hours, minutes, seconds } = split(ms);
  const units = [
    ...(days > 0 ? [{ value: days, caption: t("drops.countdown.days") }] : []),
    { value: hours, caption: t("drops.countdown.hours") },
    { value: minutes, caption: t("drops.countdown.minutes") },
    { value: seconds, caption: t("drops.countdown.seconds") },
  ];
  return (
    <div className="mt-3 flex justify-center gap-3 md:gap-5" role="timer" aria-live="off">
      {units.map((u) => (
        <div key={u.caption} className="flex flex-col items-center">
          <span
            className={cn(
              "relative overflow-hidden font-display tabular-nums leading-none text-paper",
              big ? "text-6xl md:text-8xl" : "text-3xl md:text-4xl"
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={u.value}
                initial={{ y: "-60%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "60%", opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {String(u.value).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="mt-2 text-[10px] uppercase tracking-widest2 text-paper/40">{u.caption}</span>
        </div>
      ))}
    </div>
  );
}

function PieceCard({
  piece,
  hidden,
  stock,
  startStock,
  locale,
}: {
  piece: DropPiece;
  hidden: boolean;
  stock: number;
  startStock: number;
  locale: string;
}) {
  const { t } = useTranslation();
  const soldOut = stock === 0;
  const low = !soldOut && stock <= LOW_STOCK;

  const card = (
    <>
      <div className="relative aspect-4/5 overflow-hidden bg-studio">
        {piece.image && (
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ filter: hidden ? "blur(22px) brightness(0.9)" : "blur(0px) brightness(1)", scale: hidden ? 1.08 : 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={piece.image.url}
              alt={hidden ? "" : piece.image.alt || piece.name}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-contain p-4"
            />
          </motion.div>
        )}
        {hidden && (
          <span className="absolute inset-x-0 bottom-3 text-center text-[10px] uppercase tracking-widest2 text-ink/70">
            {t("drops.live.revealedAtOpening")}
          </span>
        )}
        {!hidden && soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/60 font-display text-3xl uppercase text-paper">
            {t("product.soldOut")}
          </span>
        )}
      </div>
      <p className={cn("mt-3 text-sm text-paper", hidden && "blur-[3px]")}>{hidden ? "••••••" : piece.name}</p>
      {!hidden && <p className="text-sm text-paper/50">{formatPrice(piece.price, locale, t("product.priceUndefined"))}</p>}
      {!hidden && low && (
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-widest2 text-paper">{t("product.lowStock", { count: stock })}</p>
          <div className="mt-1 h-1 bg-line">
            <motion.div
              className="h-full bg-red-500"
              initial={false}
              animate={{ width: `${Math.max(4, (stock / Math.max(startStock, LOW_STOCK)) * 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <li>
      {hidden ? (
        <div aria-label={t("drops.live.revealedAtOpening")}>{card}</div>
      ) : (
        <Link href={`/catalogue/${piece.slug}`} className="block transition-opacity hover:opacity-90">
          {card}
        </Link>
      )}
    </li>
  );
}

function NotifyForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "drop" }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  }

  if (state === "done") return <p className="mt-10 text-sm text-paper/70">{t("drops.live.notifyCheckEmail")}</p>;

  return (
    <form onSubmit={submit} className="mx-auto mt-10 flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("drops.live.notifyPlaceholder")}
        aria-label={t("drops.live.notifyPlaceholder")}
        className="flex-1 border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-hidden"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {t("drops.live.notifyButton")}
      </button>
      {state === "error" && <p className="text-xs text-paper/60 sm:basis-full">{t("drops.live.notifyError")}</p>}
    </form>
  );
}

/** Affiche brièvement chaque nouvelle vente réelle (sans aucune donnée personnelle). */
function RecentSaleToast({ sales, now }: { sales: DropLiveData["recentSales"]; now: number | null }) {
  const { t } = useTranslation();
  const latest = sales[0];
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!latest || now === null || minutesAgo(latest.at, now) > 30) return;
    setShown(latest.at);
    const id = setTimeout(() => setShown(null), 7000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement à l'arrivée d'une nouvelle vente
  }, [latest?.at]);

  const minutes = latest && now !== null ? minutesAgo(latest.at, now) : 0;
  return (
    <AnimatePresence>
      {latest && shown === latest.at && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-5 z-40 max-w-[18rem] border border-line bg-ink/95 px-4 py-3 text-xs text-paper shadow-lg backdrop-blur-sm"
        >
          <span className="mr-1">🔥</span>
          {t("drops.live.justSold", { name: latest.name })}
          <span className="block text-paper/40">
            {minutes === 0 ? t("drops.live.agoNow") : t("drops.live.agoMinutes", { count: minutes })}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
