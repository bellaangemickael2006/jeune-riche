import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { getServerTranslation } from "@/lib/i18n/server";
import { WHATSAPP_NUMBER } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("legal.contact.eyebrow") };
}

export default async function ContactPage() {
  const { t } = await getServerTranslation();
  return (
    <PlaceholderPage
      eyebrow={t("legal.contact.eyebrow")}
      title={t("legal.contact.title")}
      message={t("legal.contact.message")}
      action={
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 items-center justify-center border border-paper/60 px-10 font-display text-[11px] uppercase leading-none tracking-widest2 text-paper transition-colors duration-200 ease-editorial hover:border-paper hover:bg-paper/5"
        >
          {t("legal.contact.cta")}
        </a>
      }
    />
  );
}
