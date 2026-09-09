import type { Metadata } from "next";
import Link from "next/link";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("legal.about.eyebrow") };
}

export default async function AProposPage() {
  const { t } = await getServerTranslation();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">{t("legal.about.eyebrow")}</p>
      <h1 className="font-display text-3xl uppercase text-paper md:text-4xl">{t("legal.about.title")}</h1>
      <p className="max-w-md text-sm leading-relaxed text-paper/50">{t("legal.about.message")}</p>
      <Link href="/manifeste" className="mt-2 text-xs uppercase tracking-widest2 underline underline-offset-4 text-paper">
        {t("legal.about.cta")}
      </Link>
    </div>
  );
}
