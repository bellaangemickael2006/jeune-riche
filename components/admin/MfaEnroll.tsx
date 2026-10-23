"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordMfaEnrolled } from "@/lib/actions/adminMfa";
import MfaShell, { CodeInput } from "@/components/admin/MfaShell";

type Enrollment = { factorId: string; qrCode: string; secret: string };

/**
 * Enregistrement du téléphone : QR code à scanner avec Google Authenticator
 * (ou équivalent), puis premier code pour confirmer. La session passe alors
 * au niveau « vérifié » (aal2) et l'admin s'ouvre.
 */
export default function MfaEnroll() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Une seule fois, même si React monte le composant deux fois en développement.
    if (started.current) return;
    started.current = true;
    (async () => {
      const mfa = createClient().auth.mfa;
      // Un essai précédent abandonné laisse un appareil non confirmé : on le retire.
      const { data: existing } = await mfa.listFactors();
      for (const factor of existing?.all ?? []) {
        if (factor.factor_type === "totp" && factor.status !== "verified") await mfa.unenroll({ factorId: factor.id });
      }
      const { data, error: enrollError } = await mfa.enroll({ factorType: "totp", friendlyName: `Admin ${new Date().toISOString().slice(0, 10)}` });
      if (enrollError || !data) {
        setError(
          "Impossible de préparer la double vérification. Vérifiez dans Supabase → Authentication → Multi-Factor que « TOTP » est activé, puis rechargez la page."
        );
        return;
      }
      setEnrollment({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, []);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setBusy(true);
    setError(null);
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({ factorId: enrollment.factorId, code });
    if (verifyError) {
      setBusy(false);
      setCode("");
      setError("Code incorrect ou expiré. Tapez le code affiché en ce moment dans l'application.");
      return;
    }
    await recordMfaEnrolled();
    router.replace("/admin");
    router.refresh();
  }

  return (
    <MfaShell title="Double vérification">
      <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-paper/70">
        <li>Installez Google Authenticator (ou Microsoft Authenticator) sur votre téléphone.</li>
        <li>Dans l&apos;application, ajoutez un compte en scannant ce QR code.</li>
        <li>Tapez ci-dessous le code à 6 chiffres affiché.</li>
      </ol>

      {enrollment ? (
        <>
          {/* QR code fourni par Supabase (image SVG en data:, autorisée par la CSP). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrollment.qrCode} alt="QR code de double vérification" className="mx-auto mt-6 h-44 w-44 bg-white p-2" />
          <p className="mt-4 text-[11px] leading-relaxed text-paper/70">
            Impossible de scanner ? Saisissez cette clé à la main. Gardez-la aussi en lieu sûr : elle permet de réinstaller
            le code sur un nouveau téléphone.
          </p>
          <p className="mt-2 select-all break-all border border-line px-3 py-2 text-center font-mono text-xs text-paper">
            {enrollment.secret}
          </p>
          <form onSubmit={confirm} className="mt-6 flex flex-col gap-4">
            <CodeInput value={code} onChange={setCode} />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="bg-paper py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-50"
            >
              {busy ? "Vérification…" : "Activer"}
            </button>
          </form>
        </>
      ) : (
        !error && <p className="mt-6 text-center text-xs text-paper/60">Préparation…</p>
      )}
      {error && (
        <p role="alert" className="mt-4 border border-paper/30 px-3 py-2 text-xs text-paper">
          {error}
        </p>
      )}
    </MfaShell>
  );
}
