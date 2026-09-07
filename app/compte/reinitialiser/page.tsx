"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid" | "submitting" | "done";

// Le lien envoyé par resetPasswordForEmail redirige ici avec soit ?code=...
// (flux PKCE, à échanger explicitement), soit un #access_token dans le hash
// que le client Supabase détecte tout seul au montage (detectSessionInUrl) —
// on gère les deux plutôt que de supposer lequel Supabase utilisera.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setStatus("ready");
      }
    });

    const code = new URL(window.location.href).searchParams.get("code");

    async function init() {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        setStatus(exchangeError ? "invalid" : "ready");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("ready");
        return;
      }
      // Laisse une courte fenêtre au flux par hash (#access_token) pour
      // s'établir avant de conclure que le lien est invalide ou expiré.
      setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        setStatus(retry.session ? "ready" : "invalid");
      }, 1200);
    }

    init();
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("submitting");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Une erreur est survenue, réessayez.");
      setStatus("ready");
      return;
    }
    setStatus("done");
    setTimeout(() => router.push("/compte"), 2000);
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24">
      <div className="mx-auto w-full max-w-sm border border-line px-8 py-10">
        <Image
          src="/images/logo/logo-transparent.png"
          alt="JEUNE RICHE"
          width={120}
          height={120}
          className="mx-auto h-12 w-12 object-contain"
        />
        <h1 className="mt-4 text-center font-editorial text-2xl text-paper">Nouveau mot de passe</h1>

        {status === "checking" && (
          <p className="mt-8 text-center text-sm text-paper/50">Vérification du lien...</p>
        )}

        {status === "invalid" && (
          <div className="mt-8 text-center">
            <p className="text-sm text-paper/70">
              Ce lien est invalide ou a expiré. Redemandez-en un depuis la page de connexion.
            </p>
            <a
              href="/compte"
              className="mt-4 inline-block text-xs uppercase tracking-widest2 text-paper underline underline-offset-4"
            >
              Retour à la connexion
            </a>
          </div>
        )}

        {status === "done" && (
          <p className="mt-8 text-center text-sm text-paper/70">
            Mot de passe mis à jour. Redirection vers votre compte...
          </p>
        )}

        {(status === "ready" || status === "submitting") && (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">
                Nouveau mot de passe
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">
                Confirmer le mot de passe
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
              />
            </label>
            {error && <p className="text-xs font-medium text-paper">{error}</p>}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-2 bg-paper py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {status === "submitting" ? "…" : "Mettre à jour"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
