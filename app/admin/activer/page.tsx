"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Activation d'un accès à l'administration (lien reçu par email, voir
// lib/actions/team.ts). Le jeton n'est utilisé qu'au clic sur « Activer » :
// un scanner de messagerie qui ouvre le lien ne le consomme pas.
export default function ActivateAdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(new URL(window.location.href).searchParams.get("token_hash"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("8 caractères minimum.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    if (!token) return setError("Lien incomplet : ouvrez le lien reçu par email.");
    setBusy(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: token, type: "invite" });
    if (otpError) {
      setBusy(false);
      return setError("Ce lien est invalide ou a expiré. Demandez une nouvelle invitation au propriétaire.");
    }
    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setBusy(false);
      return setError("Mot de passe refusé : choisissez-en un autre.");
    }
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <form onSubmit={submit} className="w-full max-w-sm border border-line px-8 py-10">
        <p className="font-display text-sm uppercase tracking-wide text-paper">Jeune Riche</p>
        <h1 className="mt-4 font-editorial text-2xl text-paper">Activer mon accès</h1>
        <p className="mt-2 text-xs text-paper/70">Choisissez le mot de passe de votre accès à l&apos;administration.</p>
        <label className="mt-6 block">
          <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Mot de passe</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/70">Confirmer</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-hidden"
          />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-xs text-paper">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full bg-paper py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-50"
        >
          {busy ? "Activation…" : "Activer mon accès"}
        </button>
      </form>
    </div>
  );
}
