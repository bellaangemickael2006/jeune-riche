"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { adminSignIn } from "@/lib/actions/adminAuth";

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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setError("Supabase n'est pas encore configuré.");
      setLoading(false);
      return;
    }

    // Sans try/catch, une coupure réseau laissait le bouton bloqué sur « … ».
    try {
      if (mode === "forgot") {
        await fetch("/api/account/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setMessage("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.");
        return;
      }

      // Côté serveur, avec limite d'essais (voir lib/actions/adminAuth.ts).
      const result = await adminSignIn(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-line p-8">
        <Image
          src="/images/logo/logo-transparent.png"
          alt="JEUNE RICHE"
          width={100}
          height={100}
          className="jr-logo mx-auto h-10 w-10 object-contain"
        />
        <h1 className="mt-4 text-center font-editorial text-2xl text-paper">
          {mode === "login" ? "Administration" : "Mot de passe oublié"}
        </h1>
        <p className="mt-1 text-center text-xs text-paper/40">JEUNE RICHE</p>

        {erreur === "acces_refuse" && (
          <p className="mt-4 border border-paper/30 bg-paper/5 px-3 py-2 text-xs text-paper">
            Ce compte n&apos;a pas accès à l&apos;administration.
          </p>
        )}
        {erreur === "base_indisponible" && (
          <p className="mt-4 border border-paper/30 bg-paper/5 px-3 py-2 text-xs text-paper">
            Base de données indisponible. Vérifiez la configuration Supabase.
          </p>
        )}
        {erreur === "config_manquante" && (
          <p className="mt-4 border border-paper/30 bg-paper/5 px-3 py-2 text-xs text-paper">
            Supabase n&apos;est pas encore configuré (NEXT_PUBLIC_SUPABASE_URL /
            NEXT_PUBLIC_SUPABASE_ANON_KEY manquants dans .env.local).
          </p>
        )}
        {error && <p className="mt-4 text-xs font-medium text-paper">{error}</p>}
        {message && <p className="mt-4 text-xs text-paper/70">{message}</p>}

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
        {mode === "login" && (
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
        )}
        {mode === "login" ? (
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError(null);
              setMessage(null);
            }}
            className="mt-3 text-xs text-paper/40 underline underline-offset-4 hover:text-paper/70"
          >
            Mot de passe oublié ?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
            className="mt-3 text-xs text-paper/40 underline underline-offset-4 hover:text-paper/70"
          >
            ← Retour à la connexion
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-paper py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : mode === "login" ? "Se connecter" : "Envoyer le lien"}
        </button>
      </form>
    </div>
  );
}
