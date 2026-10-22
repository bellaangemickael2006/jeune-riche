"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/components/providers/I18nProvider";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export type PushTarget = { type: "order"; token: string } | { type: "account" };

type State = "hidden" | "iosHint" | "idle" | "busy" | "on" | "denied" | "error";

function decodeKey(base64url: string) {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Stockage indisponible (navigation privée) : l'état sera simplement redemandé.
  }
}

/**
 * « Me prévenir sur ce téléphone » : abonne l'appareil aux notifications de
 * la commande suivie (ou de toutes les commandes du compte). Le client est
 * alors prévenu à chaque étape, même site fermé (voir lib/push/send.ts).
 * Invisible si le navigateur ne sait pas recevoir de notifications ; sur
 * iPhone, il faut d'abord ajouter le site à l'écran d'accueil.
 */
export default function PushToggle({ target, storageKey }: { target: PushTarget; storageKey: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [state, setState] = useState<State>("hidden");
  const stored = `jr-push:${storageKey}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator)) return;
      if (!("PushManager" in window) || !("Notification" in window)) {
        const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
        if (ios && !cancelled) setState("iosHint");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (cancelled) return;
      setState(subscription && readStored(stored) === subscription.endpoint ? "on" : "idle");
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stored]);

  async function enable() {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }
      const registration =
        (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(VAPID_PUBLIC_KEY!) }));
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, locale, subscription: subscription.toJSON() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      writeStored(stored, subscription.endpoint);
      setState("on");
    } catch {
      setState("error");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, endpoint: subscription.endpoint }),
        });
      }
    } catch {
      // L'abonnement côté serveur disparaîtra de lui-même quand la commande sera terminée.
    }
    writeStored(stored, null);
    setState("idle");
  }

  if (state === "hidden") return null;

  return (
    <div className="mt-6 border border-line px-4 py-3 text-xs">
      {state === "iosHint" && <p className="text-paper/70">{t("push.iosHint")}</p>}
      {state === "denied" && <p className="text-paper/70">{t("push.denied")}</p>}
      {state === "on" && (
        <p className="flex flex-wrap items-center justify-between gap-2 text-paper">
          <span>{t("push.enabled")}</span>
          <button type="button" onClick={disable} className="uppercase tracking-widest2 text-paper/70 underline underline-offset-4 hover:text-paper">
            {t("push.disable")}
          </button>
        </p>
      )}
      {(state === "idle" || state === "busy" || state === "error") && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-paper/70">{t(target.type === "order" ? "push.hintOrder" : "push.hintAccount")}</p>
          <button
            type="button"
            onClick={enable}
            disabled={state === "busy"}
            className="shrink-0 border border-paper px-3 py-2 uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink disabled:opacity-50"
          >
            {state === "busy" ? "…" : t("push.enable")}
          </button>
          {state === "error" && (
            <p role="alert" className="w-full text-paper">
              {t("push.error")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
