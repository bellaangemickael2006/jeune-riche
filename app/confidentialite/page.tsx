import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Confidentialité" };

export default function ConfidentialitePage() {
  return (
    <PlaceholderPage
      eyebrow="Légal"
      title="Confidentialité"
      message="Notre politique de confidentialité est en cours de rédaction et sera publiée ici avant l'ouverture des ventes."
    />
  );
}
