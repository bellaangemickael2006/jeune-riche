import type { Metadata } from "next";
import { getServerTranslation } from "@/lib/i18n/server";

// Titre de l'onglet.
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("account.phoneStepTitle") };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
