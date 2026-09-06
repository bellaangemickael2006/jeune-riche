"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import Magnetic from "@/components/ui/Magnetic";

const NAV = [
  { label: "Catalogue", href: "/catalogue" },
  { label: "Manifeste", href: "/manifeste" },
  { label: "Drops", href: "/drops" },
  { label: "À propos", href: "/a-propos" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 transition-colors duration-500 md:px-10 md:py-5",
        scrolled ? "bg-ink/90 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <Link href="/" className="flex items-center" aria-label="JEUNE RICHE — accueil">
        <Image
          src="/images/logo/logo-transparent.png"
          alt="JEUNE RICHE"
          width={200}
          height={200}
          className="h-16 w-16 object-contain md:h-20 md:w-20"
          priority
        />
      </Link>

      <nav className="hidden items-center gap-9 md:flex">
        {NAV.map((item) => (
          <Magnetic key={item.href} strength={0.5}>
            <Link
              href={item.href}
              className="inline-block font-body text-[13px] uppercase tracking-widest2 text-paper/80 transition-colors duration-300 ease-editorial hover:text-paper"
            >
              {item.label}
            </Link>
          </Magnetic>
        ))}
      </nav>

      <div className="flex items-center gap-5">
        <Link
          href="/favoris"
          className="hidden font-body text-[13px] uppercase tracking-widest2 text-paper/80 transition-colors hover:text-paper md:block"
        >
          Favoris
        </Link>
        <Link
          href="/compte"
          className="hidden font-body text-[13px] uppercase tracking-widest2 text-paper/80 transition-colors hover:text-paper md:block"
        >
          Compte
        </Link>
        <button
          onClick={openCart}
          className="font-body text-[13px] uppercase tracking-widest2 text-paper/80 transition-colors hover:text-paper"
          aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
        >
          Panier{count > 0 ? ` (${count})` : ""}
        </button>
        <button
          className="text-paper md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <span className="block h-px w-6 bg-paper" />
          <span className="mt-1.5 block h-px w-6 bg-paper" />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-6 bg-ink px-5 py-8 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl uppercase text-paper"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/compte" onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-widest2 text-paper/70">
            Compte
          </Link>
        </div>
      )}
    </header>
  );
}
