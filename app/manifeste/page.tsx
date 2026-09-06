import type { Metadata } from "next";
import ManifesteHero from "@/components/manifeste/ManifesteHero";
import ManifesteBody from "@/components/manifeste/ManifesteBody";

export const metadata: Metadata = {
  title: "Manifeste",
  description: "L'univers JEUNE RICHE.",
};

export default function ManifestePage() {
  return (
    <div className="min-h-screen bg-ink">
      <ManifesteHero />
      <ManifesteBody />
    </div>
  );
}
