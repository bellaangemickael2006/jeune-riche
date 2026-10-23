import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("checkout.confirmation.title") };
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>;
}) {
  const { numero } = await searchParams;
  const { t } = await getServerTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-5 text-center">
      <Image
        src="/images/logo/logo-transparent.png"
        alt="JEUNE RICHE"
        width={100}
        height={100}
        className="jr-logo h-16 w-16 object-contain"
      />
      <h1 className="font-editorial text-3xl text-paper md:text-4xl">{t("checkout.confirmation.title")}</h1>
      {numero && <p className="text-sm text-paper/60">{t("checkout.confirmation.reference", { number: numero })}</p>}
      <p className="max-w-sm text-sm text-paper/70">{t("checkout.confirmation.message")}</p>
      {numero && (
        <Link
          href={`/suivi?commande=${encodeURIComponent(numero)}`}
          className="mt-4 border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          {t("tracking.cta")}
        </Link>
      )}
      <Link href="/catalogue" className="mt-4 text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 hover:text-paper/70">
        {t("checkout.confirmation.backToCatalogue")}
      </Link>
    </div>
  );
}
