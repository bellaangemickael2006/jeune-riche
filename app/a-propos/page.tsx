import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "À propos" };

export default function AProposPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-label text-paper/40">À propos</p>
      <h1 className="font-editorial text-heading-lg leading-[1.05] text-paper md:text-[4rem]">Jeune Riche</h1>
      <p className="max-w-md text-body leading-relaxed text-paper/50">
        Pour l&apos;univers et la philosophie de la marque, retrouvez le manifeste JEUNE RICHE.
      </p>
      <Link href="/manifeste" className="mt-2 text-label underline underline-offset-4 text-paper">
        Lire le manifeste
      </Link>
    </div>
  );
}
