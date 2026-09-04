import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PlaceholderPage
      eyebrow="Contact"
      title="Nous contacter"
      message="Nos coordonnées officielles seront publiées ici prochainement."
    />
  );
}
