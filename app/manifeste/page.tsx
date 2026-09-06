import type { Metadata } from "next";
import ManifesteHero from "@/components/manifeste/ManifesteHero";

export const metadata: Metadata = {
  title: "Manifeste",
  description: "L'univers JEUNE RICHE.",
};

export default function ManifestePage() {
  return (
    <div className="min-h-screen bg-ink">
      <ManifesteHero />

      <section className="mx-auto max-w-2xl px-5 py-24 text-center md:px-10">
        <p className="font-editorial text-2xl italic leading-relaxed text-paper md:text-3xl">
          Une couronne gravée sur un visage tribal. Le noir qui affirme, le blanc qui respire — rien d&apos;autre.
        </p>
        <p className="mt-8 text-sm leading-relaxed text-paper/50">
          JEUNE RICHE assume la tension entre le luxe et la rue, entre la discipline du minimalisme
          et la puissance d&apos;un symbole gravé. Pas de dégradé, pas de compromis — un langage
          visuel qui se répète, se grave, se porte.
        </p>
      </section>
    </div>
  );
}
