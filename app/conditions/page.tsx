import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("legal.terms.eyebrow") };
}

export default async function ConditionsPage() {
  const { t } = await getServerTranslation();
  return (
    <PlaceholderPage
      eyebrow={t("legal.terms.eyebrow")}
      title={t("legal.terms.title")}
      message={t("legal.terms.message")}
    />
  );
}
