import type { Metadata } from "next";
import ManifesteHero from "@/components/manifeste/ManifesteHero";
import ManifesteBody from "@/components/manifeste/ManifesteBody";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: t("navigation.manifesto"),
    description: t("manifesto.metaDescription"),
  };
}

export default function ManifestePage() {
  return (
    <div className="min-h-screen bg-ink">
      <ManifesteHero />
      <ManifesteBody />
    </div>
  );
}
