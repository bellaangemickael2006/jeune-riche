import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">404</p>
      <h1 className="font-display text-3xl uppercase text-paper md:text-4xl">Page introuvable</h1>
      <p className="max-w-sm text-sm text-paper/50">
        Cette page n&apos;existe pas ou n&apos;est plus disponible.
      </p>
      <Link href="/" className="mt-4 text-xs uppercase tracking-widest2 underline underline-offset-4 text-paper">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
