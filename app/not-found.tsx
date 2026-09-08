import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-4 overflow-hidden px-5 text-center">
      <Image
        src="/images/logo/logo-transparent.png"
        alt=""
        aria-hidden
        width={360}
        height={360}
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.035]"
      />
      <p className="relative text-xs uppercase tracking-widest2 text-paper/40">404</p>
      <h1 className="relative font-editorial text-4xl text-paper md:text-5xl">Page introuvable</h1>
      <p className="relative max-w-sm text-sm text-paper/50">
        Cette page n&apos;existe pas ou n&apos;est plus disponible.
      </p>
      <Link
        href="/"
        className="relative mt-4 text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 hover:text-paper/70"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
