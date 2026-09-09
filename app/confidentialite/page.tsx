import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("legal.privacy.eyebrow") };
}

export default async function ConfidentialitePage() {
  const { t } = await getServerTranslation();
  return (
    <PlaceholderPage
      eyebrow={t("legal.privacy.eyebrow")}
      title={t("legal.privacy.title")}
      message={t("legal.privacy.message")}
    />
  );
}
