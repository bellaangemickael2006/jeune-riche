"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CONFIG_MISSING =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function AuthForms() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (CONFIG_MISSING) {
      setError(t("account.supabaseNotConfigured"));
      setLoading(false);
      return;
    }

    const supabase = createClient();

    if (mode === "forgot") {
      // Passe par notre API (lib/email.ts) pour envoyer un email au design
      // JEUNE RICHE plutôt que le template Supabase par défaut. Message
      // toujours identique, que l'email existe ou non : ne jamais laisser
      // deviner si une adresse est inscrite ou pas.
      await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setMessage(t("account.forgotEmailSent"));
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      // Passe par notre API (lib/email.ts + admin.generateLink) pour garder
      // la main sur l'email de confirmation — sinon supabase.auth.signUp()
      // déclenche l'envoi automatique par Supabase lui-même (branding générique).
      const res = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || t("account.supabaseNotConfigured"));
        setLoading(false);
        return;
      }
      setMessage(t("account.signupSuccess"));
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(t("account.invalidCredentials"));
      setLoading(false);
      return;
    }
    // Ramène le client vers l'accueil avec l'animation de bienvenue
    // (LoginWelcome, voir components/home/LoginWelcome.tsx) plutôt que de
    // rester sur /compte — un vrai moment de retour, pas juste un
    // rafraîchissement silencieux du tableau de bord.
    router.push("/?login=1");
  }

  return (
    <div className="mx-auto w-full max-w-sm border border-line px-8 py-10">
      <Image
        src="/images/logo/logo-transparent.png"
        alt="JEUNE RICHE"
        width={120}
        height={120}
        className="jr-logo mx-auto h-12 w-12 object-contain"
      />
      <h1 className="mt-4 text-center font-editorial text-2xl text-paper">
        {mode === "login" ? t("account.welcomeBack") : mode === "signup" ? t("account.joinTitle") : t("account.forgotTitle")}
      </h1>
      <p className="mt-1 text-center text-xs text-paper/40">
        {mode === "login"
          ? t("account.loginSubtitle")
          : mode === "signup"
            ? t("account.signupSubtitle")
            : t("account.forgotSubtitle")}
      </p>

      {mode === "forgot" ? (
        <button
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className="mt-8 text-xs uppercase tracking-widest2 text-paper/50 underline underline-offset-4 hover:text-paper"
        >
          ← {t("account.backToLogin")}
        </button>
      ) : (
        <div className="mt-8 flex gap-6 border-b border-line text-xs uppercase tracking-widest2">
          <button
            onClick={() => setMode("login")}
            className={cn("pb-3 transition-colors", mode === "login" ? "border-b border-paper text-paper" : "text-paper/40 hover:text-paper/70")}
          >
            {t("account.login")}
          </button>
          <button
            onClick={() => setMode("signup")}
            className={cn("pb-3 transition-colors", mode === "signup" ? "border-b border-paper text-paper" : "text-paper/40 hover:text-paper/70")}
          >
            {t("account.signup")}
          </button>
        </div>
      )}

      {CONFIG_MISSING && (
        <p className="mb-4 mt-4 border border-paper/30 bg-paper/5 px-3 py-2 text-xs text-paper">
          {t("account.supabaseNotConfiguredHint")}
        </p>
      )}
      {error && <p className="mb-4 mt-4 text-xs font-medium text-paper">{error}</p>}
      {message && <p className="mb-4 mt-4 text-xs text-paper/70">{message}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">{t("account.name")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            />
          </label>
        )}
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">{t("account.email")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
          />
        </label>
        {mode === "signup" && (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">{t("account.phone")}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            />
          </label>
        )}
        {mode !== "forgot" && (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">{t("account.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            />
          </label>
        )}
        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError(null);
              setMessage(null);
            }}
            className="-mt-2 w-fit text-xs text-paper/40 underline underline-offset-4 hover:text-paper/70"
          >
            {t("account.forgotPassword")}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-paper py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "…"
            : mode === "login"
              ? t("account.signIn")
              : mode === "signup"
                ? t("account.createAccount")
                : t("account.sendLink")}
        </button>
      </form>
    </div>
  );
}
