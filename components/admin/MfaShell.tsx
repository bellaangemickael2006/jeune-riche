"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Cadre commun des écrans de double vérification (même style que la connexion). */
export default function MfaShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-10">
      <div className="w-full max-w-sm border border-line p-8">
        <Image
          src="/images/logo/logo-transparent.png"
          alt="JEUNE RICHE"
          width={100}
          height={100}
          className="jr-logo mx-auto h-10 w-10 object-contain"
        />
        <h1 className="mt-4 text-center font-editorial text-2xl text-paper">{title}</h1>
        <p className="mt-1 text-center text-xs text-paper/40">JEUNE RICHE · Administration</p>
        <div className="mt-8">{children}</div>
        <button
          type="button"
          onClick={logout}
          className="mt-8 w-full text-center text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-paper"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

/** Champ du code à 6 chiffres, rempli automatiquement par le téléphone quand c'est possible. */
export function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      required
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="000000"
      aria-label="Code à 6 chiffres"
      className="w-full border border-line bg-transparent px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-paper placeholder:text-paper/20 focus:border-paper focus:outline-hidden"
    />
  );
}
