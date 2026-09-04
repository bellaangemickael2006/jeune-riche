import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Conditions générales" };

export default function ConditionsPage() {
  return (
    <PlaceholderPage
      eyebrow="Légal"
      title="Conditions générales"
      message="Nos conditions générales de vente sont en cours de rédaction et seront publiées ici avant l'ouverture des ventes."
    />
  );
}
