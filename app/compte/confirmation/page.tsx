"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { ButtonLink } from "@/components/ui/Button";

type Status = "checking" | "confirmed" | "invalid";

// Délai avant redirection auto vers l'accueil après confirmation : assez
// court pour rester fluide, assez long pour laisser le temps de lire le
// message "Inscription confirmée" avant que la page ne change.
const REDIRECT_DELAY_MS = 1800;

// Le lien envoyé par email pointe directement ici avec ?token_hash=...&type=signup
// (voir app/api/account/signup/route.ts) plutôt que vers l'endpoint /verify de
// Supabase : un scanner de sécurité d'email qui suit le lien automatiquement ne
// déclenche qu'un GET sur cette page (aucun effet), alors que le token à usage
// unique ne serait consommé que par ce useEffect, exécuté uniquement dans un
// vrai navigateur qui charge la page. On garde aussi les cas ?code=... (PKCE)
// et #access_token=... (fragment, jamais transmis au serveur) en repli, pour
// rester compatible avec d'anciens liens ou d'autres flux Supabase. Même
// logique que app/compte/reinitialiser/page.tsx pour ces deux derniers cas.
export default function SignupConfirmationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  // Une fois le compte confirmé, on ramène directement le client sur le site
  // (accueil) où une petite animation de bienvenue s'affiche — voir
  // components/home/WelcomeToast.tsx. Pas besoin de cliquer sur quoi que ce
  // soit : c'est le comportement attendu, le bouton "Accéder à mon compte"
  // reste affiché en repli si jamais la redirection auto échoue (JS bloqué…).
  useEffect(() => {
    if (status !== "confirmed") return;
    const timer = setTimeout(() => {
      router.push("/?welcome=1");
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, router]);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const url = new URL(window.location.href);

      const tokenHash = url.searchParams.get("token_hash");
      const otpType = url.searchParams.get("type");
      if (tokenHash && otpType) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType as "signup" | "email",
        });
        setStatus(error ? "invalid" : "confirmed");
        return;
      }

      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        setStatus(error ? "invalid" : "confirmed");
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        setStatus(error ? "invalid" : "confirmed");
        return;
      }

      const { data } = await supabase.auth.getSession();
      setStatus(data.session ? "confirmed" : "invalid");
    }

    init();
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24">
      <div className="mx-auto w-full max-w-sm border border-line px-8 py-10 text-center">
        <Image
          src="/images/logo/logo-transparent.png"
          alt="JEUNE RICHE"
          width={120}
          height={120}
          className="jr-logo mx-auto h-12 w-12 object-contain"
        />
        <h1 className="mt-4 font-editorial text-2xl text-paper">{t("account.confirmationTitle")}</h1>

        {status === "checking" && (
          <p className="mt-8 text-sm text-paper/50">{t("account.checkingLink")}</p>
        )}

        {status === "confirmed" && (
          <div className="mt-8">
            <p className="text-sm text-paper/70">{t("account.confirmationSuccess")}</p>
            <ButtonLink href="/?welcome=1" className="mt-6">
              {t("account.confirmationCta")}
            </ButtonLink>
          </div>
        )}

        {status === "invalid" && (
          <div className="mt-8">
            <p className="text-sm text-paper/70">{t("account.confirmationInvalid")}</p>
            <a
              href="/compte"
              className="mt-6 inline-block text-xs uppercase tracking-widest2 text-paper underline underline-offset-4"
            >
              {t("account.backToLogin")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
