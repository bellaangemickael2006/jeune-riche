import type { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n/server";

// Titre de l'onglet ; page personnelle, exclue des moteurs de recherche.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("navigation.favorites"), robots: { index: false, follow: false } };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
