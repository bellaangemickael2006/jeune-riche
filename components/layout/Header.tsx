"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";
import Magnetic from "@/components/ui/Magnetic";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/lib/scrollLock";

const NAV = [
  { label: "Collection", href: "/catalogue" },
  { label: "Manifeste", href: "/manifeste" },
  { label: "Drops", href: "/drops" },
  { label: "À propos", href: "/a-propos" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  useScrollLock(menuOpen || searchOpen);

  // Une navigation (lien nav desktop, logo, retour navigateur...) doit
  // toujours refermer les panneaux ouverts, pas seulement les clics gérés
  // manuellement sur chaque lien.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, menuOpen]);

  // Un clic en dehors du header (sur la page derrière un panneau ouvert)
  // doit aussi refermer — comme le reste du header, le panier ou le zoom.
  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen, menuOpen]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b bg-ink transition-[padding,box-shadow] duration-300 ease-editorial",
        scrolled ? "border-line py-3 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)] md:py-3.5" : "border-line py-4 md:py-5"
      )}
    >
      <div className="flex items-center justify-between px-5 md:px-10">
        <Link href="/" className="flex items-center" aria-label="JEUNE RICHE — accueil">
          <Image
            src="/images/logo/logo-transparent.png"
            alt="JEUNE RICHE"
            width={200}
            height={200}
            className={cn(
              "object-contain transition-[height,width] duration-300 ease-editorial",
              scrolled ? "h-12 w-12 md:h-14 md:w-14" : "h-16 w-16 md:h-20 md:w-20"
            )}
            priority
          />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <Magnetic key={item.href} strength={0.5}>
              <Link
                href={item.href}
                className="inline-block text-label text-paper/80 transition-colors duration-300 ease-editorial hover:text-paper"
              >
                {item.label}
              </Link>
            </Magnetic>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <ThemeToggle className="hidden text-paper/80 transition-colors hover:text-paper md:block" />
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="hidden text-paper/80 transition-colors hover:text-paper md:block"
            aria-label="Rechercher"
            aria-expanded={searchOpen}
          >
            <SearchIcon />
          </button>
          <Link
            href="/favoris"
            className="hidden text-label text-paper/80 transition-colors hover:text-paper md:block"
          >
            Favoris
          </Link>
          <Link
            href="/compte"
            className="hidden text-label text-paper/80 transition-colors hover:text-paper md:block"
          >
            Compte
          </Link>
          <button
            onClick={() => {
              setSearchOpen(false);
              setMenuOpen(false);
              openCart();
            }}
            className="text-label text-paper/80 transition-colors hover:text-paper"
            aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
          >
            Panier{count > 0 ? ` (${count})` : ""}
          </button>
          <ThemeToggle className="text-paper md:hidden" />
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            className="text-paper md:hidden"
            aria-label="Rechercher"
            aria-expanded={searchOpen}
          >
            <SearchIcon />
          </button>
          <button
            className="text-paper md:hidden"
            onClick={() => {
              setMenuOpen((v) => !v);
              setSearchOpen(false);
            }}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className="block h-px w-6 bg-paper" />
            <span className="mt-1.5 block h-px w-6 bg-paper" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-x-0 top-full flex flex-col gap-6 border-t border-line bg-ink px-5 py-8 md:hidden"
          >
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
            <Link href="/favoris" onClick={() => setMenuOpen(false)} className="text-label text-paper/70">
              Favoris
            </Link>
            <Link href="/compte" onClick={() => setMenuOpen(false)} className="text-label text-paper/70">
              Compte
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <line x1="12.4" y1="12.4" x2="17" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/catalogue?q=${encodeURIComponent(q)}`);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-line bg-ink px-5 py-6 md:px-10 md:py-8"
    >
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-end gap-4">
        <div className="flex-1">
          <p className="text-label text-paper/40">Rechercher</p>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="T-shirt, jogger, casquette…"
            className="mt-2 w-full border-b border-line bg-transparent py-2 font-editorial text-heading text-paper placeholder:text-paper/25 focus:border-paper focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la recherche"
          className="pb-3 text-label text-paper/50 transition-colors hover:text-paper"
        >
          Fermer
        </button>
      </form>
    </motion.div>
  );
}
