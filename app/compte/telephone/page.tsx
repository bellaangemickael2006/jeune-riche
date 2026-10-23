"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import PhoneForm from "@/components/account/PhoneForm";
import { safeNext } from "@/lib/account/safeNext";

// Dernière étape après une inscription avec Google : Google ne transmet pas
// le numéro de téléphone, or WhatsApp est le canal de suivi des commandes.
export default function PhoneStepPage() {
  const { t } = useTranslation();
  const router = useRouter();
  // Destination lue au moment du départ (pas d'état ni d'effet au montage).
  const goNext = () => router.replace(safeNext(new URL(window.location.href).searchParams.get("next")));

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24">
      <div className="mx-auto w-full max-w-sm border border-line px-8 py-10">
        <Image
          src="/images/logo/logo-transparent.png"
          alt="JEUNE RICHE"
          width={120}
          height={120}
          className="jr-logo mx-auto h-12 w-12 object-contain"
        />
        <p className="mt-4 text-center text-xs uppercase tracking-widest2 text-paper/70">{t("account.phoneStepEyebrow")}</p>
        <h1 className="mt-2 text-center font-editorial text-2xl text-paper">{t("account.phoneStepTitle")}</h1>
        <p className="mb-6 mt-2 text-center text-xs leading-relaxed text-paper/70">{t("account.phoneStepText")}</p>
        <PhoneForm autoFocus onSaved={goNext} />
        <button
          type="button"
          onClick={goNext}
          className="mx-auto mt-5 block text-xs text-paper/70 underline underline-offset-4 hover:text-paper"
        >
          {t("account.phoneLater")}
        </button>
      </div>
    </div>
  );
}
