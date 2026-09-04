import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Livraison" };

export default function LivraisonPage() {
  return (
    <PlaceholderPage
      eyebrow="Service"
      title="Livraison"
      message="Notre politique de livraison est en cours de finalisation et sera publiée ici prochainement."
    />
  );
}
