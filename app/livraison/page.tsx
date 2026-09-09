import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("legal.shipping.eyebrow") };
}

export default async function LivraisonPage() {
  const { t } = await getServerTranslation();
  return (
    <PlaceholderPage
      eyebrow={t("legal.shipping.eyebrow")}
      title={t("legal.shipping.title")}
      message={t("legal.shipping.message")}
    />
  );
}
