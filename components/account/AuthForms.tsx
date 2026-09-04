"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONFIG_MISSING =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function AuthForms() {
  const [mode, setMode] = useState<"login" | "signup">("login");
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
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 flex gap-6 border-b border-line text-xs uppercase tracking-widest2">
        <button
          onClick={() => setMode("login")}
          className={mode === "login" ? "border-b border-paper pb-3 text-paper" : "pb-3 text-paper/40"}
        >
          Connexion
        </button>
        <button
          onClick={() => setMode("signup")}
          className={mode === "signup" ? "border-b border-paper pb-3 text-paper" : "pb-3 text-paper/40"}
        >
          Créer un compte
        </button>
      </div>

      {CONFIG_MISSING && (
        <p className="mb-4 border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">
          Supabase n&apos;est pas encore configuré — la connexion sera disponible une fois
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY renseignés.
        </p>
      )}
      {error && <p className="mb-4 text-xs text-blood">{error}</p>}
      {message && <p className="mb-4 text-xs text-paper/70">{message}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-paper py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-50"
        >
          {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}
