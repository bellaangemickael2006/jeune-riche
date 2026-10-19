import type { Metadata } from "next";
import OrderTracker from "@/components/tracking/OrderTracker";
import { getServerTranslation } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: t("tracking.title"),
    description: t("tracking.metaDescription"),
    alternates: { canonical: "/suivi" },
  };
}

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ commande?: string }>;
}) {
  const { commande } = await searchParams;
  const { t } = await getServerTranslation();

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-label text-paper/40">{t("tracking.eyebrow")}</p>
        <h1 className="mt-3 font-editorial text-heading text-paper md:text-heading-lg">{t("tracking.title")}</h1>
        <p className="mx-auto mt-4 max-w-md text-body text-paper/50">{t("tracking.intro")}</p>
      </div>
      <div className="mt-12">
        {/* Le numéro seul peut venir de l'URL (lien de la confirmation) ;
            jamais l'email ni le téléphone. */}
        <OrderTracker initialNumber={(commande ?? "").slice(0, 32)} />
      </div>
    </div>
  );
}
