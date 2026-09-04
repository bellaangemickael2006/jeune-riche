"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const erreur = searchParams.get("erreur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase n'est pas encore configuré.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Identifiants invalides.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-line p-8">
        <p className="font-display text-xl uppercase text-paper">Administration</p>
        <p className="mt-1 text-xs text-paper/40">JEUNE RICHE</p>

        {erreur === "acces_refuse" && (
          <p className="mt-4 border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">
            Ce compte n&apos;a pas accès à l&apos;administration.
          </p>
        )}
        {erreur === "base_indisponible" && (
          <p className="mt-4 border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">
            Base de données indisponible. Vérifiez la configuration Supabase.
          </p>
        )}
        {erreur === "config_manquante" && (
          <p className="mt-4 border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">
            Supabase n&apos;est pas encore configuré (NEXT_PUBLIC_SUPABASE_URL /
            NEXT_PUBLIC_SUPABASE_ANON_KEY manquants dans .env.local).
          </p>
        )}
        {error && <p className="mt-4 text-xs text-blood">{error}</p>}

        <label className="mt-6 block">
          <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-paper py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
