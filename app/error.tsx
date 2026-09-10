"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonLink } from "@/components/ui/Button";

// Filet pour toute erreur survenant sous le layout racine (page, composant
// serveur ou client qui plante) — contrairement à global-error.tsx, celui-ci
// reste À L'INTÉRIEUR du layout racine : header, footer et thème restent
// visibles, l'utilisateur peut toujours naviguer ailleurs sur le site.
// global-error.tsx reste le seul filet pour un plantage du layout racine
// lui-même (là où même ce composant ne pourrait plus s'afficher).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">{t("errors.generic.eyebrow")}</p>
      <h1 className="font-editorial text-3xl text-paper md:text-4xl">{t("errors.generic.title")}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-paper/50">{t("errors.generic.message")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <Button variant="secondary" onClick={reset}>
          {t("errors.generic.retry")}
        </Button>
        <ButtonLink href="/" variant="text">
          {t("errors.generic.home")}
        </ButtonLink>
      </div>
    </div>
  );
}
