"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid" | "submitting" | "done";

// Le lien généré par auth.admin.generateLink redirige ici avec soit
// ?code=... (flux PKCE, à échanger explicitement), soit #access_token=...
// dans le FRAGMENT de l'URL (flux implicite — c'est celui que Supabase
// utilise en pratique pour la récupération de mot de passe). Un premier
// essai s'appuyait sur detectSessionInUrl pour parser le hash tout seul :
// en pratique ça n'établissait jamais la session à temps, donc le lien
// réel envoyé par email atterrissait toujours sur "lien invalide" — on lit
// et on établit la session nous-mêmes dans les deux cas au lieu d'attendre.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        setStatus(exchangeError ? "invalid" : "ready");
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        setStatus(setSessionError ? "invalid" : "ready");
        return;
      }

      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? "ready" : "invalid");
    }

    init();
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
        <h1 className="mt-4 text-center font-editorial text-heading text-paper">Nouveau mot de passe</h1>

        {status === "checking" && (
          <p className="mt-8 text-center text-body text-paper/50">Vérification du lien...</p>
        )}

        {status === "invalid" && (
          <div className="mt-8 text-center">
            <p className="text-body text-paper/70">
              Ce lien est invalide ou a expiré. Redemandez-en un depuis la page de connexion.
            </p>
            <a
              href="/compte"
              className="mt-4 inline-block text-label text-paper underline underline-offset-4"
            >
              Retour à la connexion
            </a>
          </div>
        )}

        {status === "done" && (
          <p className="mt-8 text-center text-body text-paper/70">
            Mot de passe mis à jour. Redirection vers votre compte...
          </p>
        )}

        {(status === "ready" || status === "submitting") && (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <label className="block">
              <span className="mb-2 block text-label text-paper/50">
                Nouveau mot de passe
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper focus:border-paper focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-label text-paper/50">
                Confirmer le mot de passe
              </span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full border border-line bg-transparent px-4 py-3 text-body text-paper focus:border-paper focus:outline-none"
              />
            </label>
            {error && <p className="text-caption font-medium text-paper">{error}</p>}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-2 bg-paper py-3 text-label text-ink transition-colors duration-300 ease-editorial hover:bg-studio disabled:opacity-50"
            >
              {status === "submitting" ? "…" : "Mettre à jour"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
