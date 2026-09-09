import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("legal.returns.eyebrow") };
}

export default async function RetoursPage() {
  const { t } = await getServerTranslation();
  return (
    <PlaceholderPage
      eyebrow={t("legal.returns.eyebrow")}
      title={t("legal.returns.title")}
      message={t("legal.returns.message")}
    />
  );
}
