"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MfaShell, { CodeInput } from "@/components/admin/MfaShell";

/** Saisie du code à 6 chiffres après le mot de passe. */
export default function MfaVerify() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const mfa = createClient().auth.mfa;
    const { data: factors } = await mfa.listFactors();
    const factor = factors?.totp?.[0];
    const { error: verifyError } = factor
      ? await mfa.challengeAndVerify({ factorId: factor.id, code })
      : { error: new Error("aucun appareil") };
    if (verifyError) {
      setBusy(false);
      setCode("");
      setError("Code incorrect ou expiré. Tapez le code affiché en ce moment dans l'application.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <MfaShell title="Code de vérification">
      <p className="text-xs leading-relaxed text-paper/70">
        Ouvrez Google Authenticator sur votre téléphone et tapez le code à 6 chiffres de JEUNE RICHE.
      </p>
      <form onSubmit={verify} className="mt-6 flex flex-col gap-4">
        <CodeInput value={code} onChange={setCode} />
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="bg-paper py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-50"
        >
          {busy ? "Vérification…" : "Valider"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 border border-paper/30 px-3 py-2 text-xs text-paper">
          {error}
        </p>
      )}
      <p className="mt-6 text-[11px] leading-relaxed text-paper/60">
        Téléphone perdu ? Demandez à un autre propriétaire de réinitialiser votre double vérification (Admin → Équipe).
      </p>
    </MfaShell>
  );
}
