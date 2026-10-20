import type { Metadata } from "next";
import Link from "next/link";
import PlaceholderPage from "@/components/ui/PlaceholderPage";
import { confirmUnsubscribe } from "@/lib/actions/unsubscribe";
import { getServerTranslation } from "@/lib/i18n/server";
import { readUnsubscribeToken, UNSUBSCRIBE_KINDS, type UnsubscribeKind } from "@/lib/unsubscribe";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; t?: string; fait?: string; invalide?: string; erreur?: string }>;
}) {
  const params = await searchParams;
  const { t } = await getServerTranslation();
  const kind = (UNSUBSCRIBE_KINDS as string[]).includes(params.type ?? "") ? (params.type as UnsubscribeKind) : null;
  const back = (
    <Link href="/" className="text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 hover:text-paper/70">
      {t("unsubscribe.backHome")}
    </Link>
  );

  if (kind && params.fait) {
    return <PlaceholderPage eyebrow={t("unsubscribe.eyebrow")} title={t("unsubscribe.doneTitle")} message={t(`unsubscribe.done.${kind}`)} action={back} />;
  }
  if (kind && params.erreur) {
    return <PlaceholderPage eyebrow={t("unsubscribe.eyebrow")} title={t("unsubscribe.errorTitle")} message={t("unsubscribe.error")} action={back} />;
  }

  // Le jeton est vérifié avant d'afficher le bouton : un lien abîmé l'annonce
  // tout de suite. L'adresse elle-même n'est jamais affichée.
  const valid = kind && params.t && !params.invalide ? readUnsubscribeToken(kind, params.t) !== null : false;
  if (!kind || !params.t || !valid) {
    return <PlaceholderPage eyebrow={t("unsubscribe.eyebrow")} title={t("unsubscribe.invalidTitle")} message={t("unsubscribe.invalid")} action={back} />;
  }

  return (
    <PlaceholderPage
      eyebrow={t("unsubscribe.eyebrow")}
      title={t(`unsubscribe.confirmTitle.${kind}`)}
      message={t(`unsubscribe.confirm.${kind}`)}
      action={
        <form action={confirmUnsubscribe.bind(null, kind, params.t)}>
          <button
            type="submit"
            className="border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
          >
            {t("unsubscribe.button")}
          </button>
        </form>
      }
    />
  );
}
