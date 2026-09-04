import Image from "next/image";
import Link from "next/link";

export default function ManifesteTeaser() {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-ink px-5 py-24 text-center md:px-10">
      <Image
        src="/images/badge/badge-black-on-white.png"
        alt=""
        aria-hidden
        width={600}
        height={600}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140vw] w-[140vw] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.04] md:h-[60vw] md:w-[60vw]"
      />
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-8">
        <p className="text-xs uppercase tracking-widest2 text-paper/50">Le manifeste</p>
        <p className="font-editorial text-2xl italic leading-snug text-paper md:text-4xl">
          Une couronne gravée, un visage tribal — le luxe qui ne s&apos;excuse pas d&apos;où il vient.
        </p>
        <Link
          href="/manifeste"
          className="text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          Entrer dans l&apos;univers
        </Link>
      </div>
    </section>
  );
}
