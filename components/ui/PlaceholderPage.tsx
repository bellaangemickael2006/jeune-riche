import Image from "next/image";
import type { ReactNode } from "react";

export default function PlaceholderPage({
  eyebrow,
  title,
  message,
  action,
}: {
  eyebrow: string;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center gap-4 overflow-hidden px-5 pt-24 text-center">
      <Image
        src="/images/logo/logo-transparent.png"
        alt=""
        aria-hidden
        width={360}
        height={360}
        className="jr-logo pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.035]"
      />
      <p className="relative text-xs uppercase tracking-widest2 text-paper/60">{eyebrow}</p>
      <h1 className="relative font-editorial text-4xl text-paper md:text-5xl">{title}</h1>
      <p className="relative max-w-md text-sm leading-relaxed text-paper/70">{message}</p>
      {action && <div className="relative mt-2">{action}</div>}
    </div>
  );
}
