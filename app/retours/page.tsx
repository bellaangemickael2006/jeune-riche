import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Retours" };

export default function RetoursPage() {
  return (
    <PlaceholderPage
      eyebrow="Service"
      title="Retours"
      message="Notre politique de retour est en cours de finalisation et sera publiée ici prochainement."
    />
  );
}
