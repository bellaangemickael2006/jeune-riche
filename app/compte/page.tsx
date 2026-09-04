import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Compte" };

export default function ComptePage() {
  return (
    <PlaceholderPage
      eyebrow="Compte"
      title="Espace client"
      message="La création de compte et le suivi de commande arrivent bientôt."
    />
  );
}
