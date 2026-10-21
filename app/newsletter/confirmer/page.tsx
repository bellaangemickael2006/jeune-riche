import type { Metadata } from "next";
import Link from "next/link";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { confirmSubscription } from "@/lib/actions/subscribe";
import { getServerTranslation } from "@/lib/i18n/server";
import { readSubscribeToken } from "@/lib/newsletter/confirm";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Page du lien « Confirmer mon inscription » reçu par email.
export default async function ConfirmSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; fait?: string; invalide?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const { t } = await getServerTranslation();
  const back = (
    <Link href="/" className="text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 hover:text-paper/70">
      {t("subscribe.backHome")}
    </Link>
  );

  if (params.fait) {
    return <PlaceholderPage eyebrow={t("subscribe.eyebrow")} title={t("subscribe.doneTitle")} message={t("subscribe.done")} action={back} />;
  }
  if (params.erreur) {
    return <PlaceholderPage eyebrow={t("subscribe.eyebrow")} title={t("subscribe.errorTitle")} message={t("subscribe.error")} action={back} />;
  }
  // Jeton vérifié avant d'afficher le bouton ; l'adresse n'est jamais affichée.
  if (!params.t || params.invalide || !readSubscribeToken(params.t)) {
    return <PlaceholderPage eyebrow={t("subscribe.eyebrow")} title={t("subscribe.invalidTitle")} message={t("subscribe.invalid")} action={back} />;
  }

  return (
    <PlaceholderPage
      eyebrow={t("subscribe.eyebrow")}
      title={t("subscribe.confirmTitle")}
      message={t("subscribe.confirm")}
      action={
        <form action={confirmSubscription.bind(null, params.t)}>
          <button
            type="submit"
            className="border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
          >
            {t("subscribe.button")}
          </button>
        </form>
      }
    />
  );
}
