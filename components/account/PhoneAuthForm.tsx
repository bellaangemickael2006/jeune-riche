"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { toE164 } from "@/lib/account/phone";

const RESEND_DELAY = 60; // secondes avant de pouvoir redemander un code

const inputClass =
  "w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none";
const labelClass = "mb-2 block text-xs uppercase tracking-widest2 text-paper/50";

/**
 * Connexion / inscription par numéro de téléphone : le client reçoit un code
 * à 6 chiffres par SMS (envoyé par Supabase via le fournisseur SMS configuré).
 * Aucun mot de passe. En mode connexion, un numéro inconnu n'ouvre pas de
 * compte : le client est invité à s'inscrire.
 */
export default function PhoneAuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+225 ");
  const [e164, setE164] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Changer d'onglet repart de zéro.
  useEffect(() => {
    setStep("phone");
    setCode("");
    setError(null);
  }, [mode]);

  async function sendCode(target = toE164(phone)) {
    if (!target) {
      setError(t("account.phoneInvalidIntl"));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: sendError } = await createClient().auth.signInWithOtp({
      phone: target,
      options: {
        channel: "sms",
        shouldCreateUser: mode === "signup",
        ...(mode === "signup" ? { data: { name: name.trim() } } : {}),
      },
    });
    setLoading(false);
    if (sendError) {
      const message = sendError.message.toLowerCase();
      if (mode === "login" && (message.includes("signup") || message.includes("not found"))) {
        setError(t("account.phoneNoAccount"));
      } else if (sendError.status === 429 || message.includes("rate")) {
        setError(t("account.phoneTooMany"));
      } else {
        setError(t("account.phoneSendError"));
      }
      return;
    }
    setE164(target);
    setStep("code");
    setCooldown(RESEND_DELAY);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError(t("account.phoneCodeInvalid"));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: verifyError } = await createClient().auth.verifyOtp({ phone: e164, token: code, type: "sms" });
    if (verifyError) {
      setLoading(false);
      setError(t("account.phoneCodeInvalid"));
      return;
    }
    // Crée la fiche client à la première connexion (commandes, avis, adresse).
    const res = await fetch("/api/account/sync", { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      setLoading(false);
      setError(t("account.googleAccountError"));
      return;
    }
    router.push("/?login=1");
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={verify} className="mt-6 flex flex-col gap-4">
        <p className="text-xs leading-relaxed text-paper/60">{t("account.phoneCodeSent", { phone: e164 })}</p>
        <label className="block">
          <span className={labelClass}>{t("account.phoneCode")}</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            placeholder="••••••"
            className={`${inputClass} text-center font-mono text-lg tracking-[0.5em]`}
          />
        </label>
        {error && (
          <p role="alert" className="text-xs font-medium text-paper">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-paper py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : t("account.phoneVerify")}
        </button>
        <div className="flex justify-between text-xs text-paper/40">
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
            className="underline underline-offset-4 hover:text-paper/70"
          >
            {t("account.phoneChange")}
          </button>
          <button
            type="button"
            disabled={cooldown > 0 || loading}
            onClick={() => sendCode(e164)}
            className="underline underline-offset-4 hover:text-paper/70 disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? t("account.phoneResendIn", { seconds: cooldown }) : t("account.phoneResend")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendCode();
      }}
      className="mt-6 flex flex-col gap-4"
    >
      {mode === "signup" && (
        <label className="block">
          <span className={labelClass}>{t("account.name")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className={inputClass} />
        </label>
      )}
      <label className="block">
        <span className={labelClass}>{t("account.phone")}</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className={inputClass}
        />
        <span className="mt-2 block text-[11px] text-paper/35">{t("account.phoneSmsHint")}</span>
      </label>
      {error && (
        <p role="alert" className="text-xs font-medium text-paper">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-paper py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "…" : t("account.phoneSendCode")}
      </button>
    </form>
  );
}
