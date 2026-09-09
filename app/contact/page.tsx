import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { getServerTranslation } from "@/lib/i18n/server";

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
          href="https://wa.me/2250777585367"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          {t("legal.contact.cta")}
        </a>
      }
    />
  );
}
