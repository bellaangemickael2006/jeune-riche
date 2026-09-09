"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const CONFIG_MISSING =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function AuthForms() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (CONFIG_MISSING) {
      setError("Supabase n'est pas encore configuré.");
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
      setMessage("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ supabaseId: data.user.id, email, name }),
        });
      }
      setMessage("Compte créé. Vérifiez votre email pour confirmer votre inscription si nécessaire.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Identifiants invalides.");
      setLoading(false);
      return;
    }
    router.refresh();
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
        {mode === "login" ? "Bon retour" : mode === "signup" ? "Rejoindre JEUNE RICHE" : "Mot de passe oublié"}
      </h1>
      <p className="mt-1 text-center text-xs text-paper/40">
        {mode === "login"
          ? "Accédez à votre compte et vos commandes."
          : mode === "signup"
            ? "Créez votre compte en une minute."
            : "Recevez un lien pour en choisir un nouveau."}
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
          ← Retour à la connexion
        </button>
      ) : (
        <div className="mt-8 flex gap-6 border-b border-line text-xs uppercase tracking-widest2">
          <button
            onClick={() => setMode("login")}
            className={cn("pb-3 transition-colors", mode === "login" ? "border-b border-paper text-paper" : "text-paper/40 hover:text-paper/70")}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("signup")}
            className={cn("pb-3 transition-colors", mode === "signup" ? "border-b border-paper text-paper" : "text-paper/40 hover:text-paper/70")}
          >
            Créer un compte
          </button>
        </div>
      )}

      {CONFIG_MISSING && (
        <p className="mb-4 mt-4 border border-paper/30 bg-paper/5 px-3 py-2 text-xs text-paper">
          Supabase n&apos;est pas encore configuré — la connexion sera disponible une fois
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY renseignés.
        </p>
      )}
      {error && <p className="mb-4 mt-4 text-xs font-medium text-paper">{error}</p>}
      {message && <p className="mb-4 mt-4 text-xs text-paper/70">{message}</p>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Nom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
            />
          </label>
        )}
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
          />
        </label>
        {mode !== "forgot" && (
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Mot de passe</span>
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
            Mot de passe oublié ?
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
              ? "Se connecter"
              : mode === "signup"
                ? "Créer mon compte"
                : "Envoyer le lien"}
        </button>
      </form>
    </div>
  );
}
