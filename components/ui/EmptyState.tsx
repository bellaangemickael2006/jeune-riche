import Image from "next/image";
import Link from "next/link";

export default function EmptyState({
  message,
  cta,
}: {
  message: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="relative mt-16 flex min-h-[40vh] flex-col items-center justify-center gap-5 overflow-hidden border border-line px-5 text-center">
      <Image
        src="/images/logo/logo-transparent.png"
        alt=""
        aria-hidden
        width={280}
        height={280}
        className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.04]"
      />
      <p className="relative font-editorial text-xl text-paper/70">{message}</p>
      {cta && (
        <Link
          href={cta.href}
          className="relative text-xs uppercase tracking-widest2 text-blood underline underline-offset-4 hover:text-paper"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
