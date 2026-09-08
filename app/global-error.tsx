"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Ne se déclenche que si le layout racine lui-même plante — doit donc
// fournir son propre <html>/<body>, sans dépendre de SiteChrome ni des
// providers habituels (potentiellement responsables de l'erreur).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ background: "#0b0b0c", color: "#f5f4f1", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            textAlign: "center",
            padding: 20,
          }}
        >
          <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.4 }}>
            Erreur
          </p>
          <h1 style={{ fontSize: 28, margin: 0 }}>Une erreur est survenue</h1>
          <p style={{ fontSize: 14, opacity: 0.5, maxWidth: 360 }}>
            L&apos;équipe a été prévenue automatiquement. Réessayez dans un instant.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 8,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textDecoration: "underline",
              background: "none",
              border: "none",
              color: "#f5f4f1",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
