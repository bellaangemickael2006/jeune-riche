import type { Metadata } from "next";
import PlaceholderPage from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PlaceholderPage
      eyebrow="Contact"
      title="Nous contacter"
      message="Le plus rapide pour nous joindre reste WhatsApp — nous répondons directement."
      action={
        <a
          href="https://wa.me/2250777585367"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-paper px-6 py-3 text-label text-paper hover:bg-paper hover:text-ink"
        >
          Écrire sur WhatsApp
        </a>
      }
    />
  );
}
