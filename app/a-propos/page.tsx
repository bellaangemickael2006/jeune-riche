import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "À propos" };

export default function AProposPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">À propos</p>
      <h1 className="font-display text-3xl uppercase text-paper md:text-4xl">Jeune Riche</h1>
      <p className="max-w-md text-sm leading-relaxed text-paper/50">
        Pour l&apos;univers et la philosophie de la marque, retrouvez le manifeste JEUNE RICHE.
      </p>
      <Link href="/manifeste" className="mt-2 text-xs uppercase tracking-widest2 underline underline-offset-4 text-paper">
        Lire le manifeste
      </Link>
    </div>
  );
}
