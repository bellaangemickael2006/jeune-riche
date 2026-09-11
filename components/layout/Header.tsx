"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/store/cart";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/lib/scrollLock";

export default function Header() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.count());
  const openCart = useCart((s) => s.open);
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const isHome = pathname === "/";
  // La fiche produit (ProductViewer) et le checkout affichent déjà leur
  // propre bouton "Retour" contextuel — en ajouter un second ici ferait
  // doublon à l'écran plutôt que de combler un manque.
  const hasOwnBackButton = pathname === "/checkout" || (pathname?.startsWith("/catalogue/") ?? false);
  const showBack = !isHome && !hasOwnBackButton;
  useScrollLock(menuOpen || searchOpen);

  // En PWA installée (mode standalone), il n'y a ni barre d'adresse ni geste
  // "retour" du navigateur — sur iOS notamment, une app ajoutée à l'écran
  // d'accueil ne propose aucune navigation arrière native. Sans ce bouton, un
  // client entré dans le catalogue ou une fiche produit depuis l'accueil n'a
  // aucun moyen de revenir en arrière autrement qu'en retapant le logo
  // (retour à l'accueil, pas à l'écran précédent). Visible uniquement sur
  // mobile : le navigateur desktop a toujours son propre bouton retour.
  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  const NAV = [
    { label: t("navigation.collection"), href: "/catalogue" },
    { label: t("navigation.atelier"), href: "/atelier" },
    { label: t("navigation.manifesto"), href: "/manifeste" },
    { label: t("navigation.drops"), href: "/drops" },
    { label: t("navigation.about"), href: "/a-propos" },
  ];

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
        scrolled ? "border-line py-2.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.6)] md:py-3" : "border-line py-3 md:py-4"
      )}
    >
      <div className="relative z-20 flex items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              aria-label={t("common.back")}
              className="-ml-1 flex h-9 w-9 items-center justify-center text-paper/80 transition-colors hover:text-paper lg:hidden"
            >
              <BackArrowIcon />
            </button>
          )}
          <Link href="/" className="flex items-center" aria-label="JEUNE RICHE — accueil">
            <Image
              src="/images/logo/logo-transparent.png"
              alt="JEUNE RICHE"
              width={200}
              height={200}
              className={cn(
                "jr-logo object-contain transition-[height,width] duration-300 ease-editorial",
                scrolled ? "h-9 w-9 md:h-10 md:w-10" : "h-11 w-11 md:h-12 md:w-12"
              )}
              priority
            />
          </Link>
        </div>

        {/* Les liens fuyaient le curseur (effet magnétique) — un tic de
            portfolio, pas de maison. Remplacé par un filet qui se déploie
            sous le lien : la nav bouge, mais elle reste lisible. */}
        <nav className="hidden items-center gap-10 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative inline-block pb-1 font-display text-[11px] uppercase tracking-widest2 text-paper/70 transition-colors duration-300 ease-editorial hover:text-paper"
            >
              {item.label}
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-paper transition-transform duration-300 ease-editorial group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Le bandeau portait neuf contrôles simultanés (langue, thème,
            recherche, favoris, compte, panier + doublons mobile) — aucune
            maison de mode n'en expose autant. Il n'en reste que deux :
            le panier, et une entrée de menu unique qui contient tout le
            reste. Rien n'est supprimé, tout est rangé. */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              setSearchOpen(false);
              setMenuOpen(false);
              openCart();
            }}
            className="font-display text-[11px] uppercase tracking-widest2 text-paper/70 transition-colors hover:text-paper"
            aria-label={t("navigation.cartWithCount", { count })}
          >
            {t("navigation.cart")}
            <span className="ml-2 tabular-nums text-paper">{String(count).padStart(2, "0")}</span>
          </button>

          <button
            onClick={() => {
              setMenuOpen((v) => !v);
              setSearchOpen(false);
            }}
            aria-label={t("navigation.menu")}
            aria-expanded={menuOpen}
            className="flex flex-col items-end gap-1.5 py-1 text-paper"
          >
            <span className="block h-px w-6 bg-paper" />
            <span className="block h-px w-4 bg-paper transition-[width] duration-300 ease-editorial group-hover:w-6" />
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
            // fixed + inset-0 (pas absolute/top-full) : couvre tout le viewport
            // sous le bandeau (pt-28 dégage le logo/icônes dans les deux états
            // scrolled/non-scrolled) au lieu de s'arrêter à la hauteur de son
            // propre contenu — sinon la page derrière reste visible juste en
            // dessous du menu, alors que le scroll du body est déjà verrouillé
            // (useScrollLock) comme si le menu occupait tout l'écran. z-10 (<
            // z-20 du bandeau ci-dessus) pour que le logo/icônes restent
            // cliquables par-dessus (fermer via le bouton menu redevenu visible).
            className="fixed inset-0 z-10 flex flex-col overflow-y-auto border-t border-line bg-ink px-5 pb-10 pt-28 md:px-10"
          >
            {/* Les destinations principales, en grand. Fraunces et non Anton :
                ce sont des noms de lieux de la maison, pas des étiquettes
                d'interface. */}
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-line py-4 font-editorial text-[2rem] leading-none text-paper transition-opacity hover:opacity-60 md:text-[3rem]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Tout ce qui encombrait le bandeau vit maintenant ici. */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="text-label text-paper/60 transition-colors hover:text-paper"
              >
                {t("navigation.search")}
              </button>
              <Link href="/favoris" onClick={() => setMenuOpen(false)} className="text-label text-paper/60 transition-colors hover:text-paper">
                {t("navigation.favorites")}
              </Link>
              <Link href="/compte" onClick={() => setMenuOpen(false)} className="text-label text-paper/60 transition-colors hover:text-paper">
                {t("navigation.account")}
              </Link>
              <Link href="/a-propos" onClick={() => setMenuOpen(false)} className="text-label text-paper/60 transition-colors hover:text-paper">
                {t("navigation.about")}
              </Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)} className="text-label text-paper/60 transition-colors hover:text-paper">
                {t("footer.contact")}
              </Link>
            </div>

            <div className="mt-auto flex items-center gap-6 pt-10">
              <LanguageSwitcher />
              <ThemeToggle className="text-paper/60 transition-colors hover:text-paper" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M12.5 4.5L6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function SearchPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
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
          <p className="text-label text-paper/40">{t("navigation.search")}</p>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("navigation.searchPlaceholder")}
            className="mt-2 w-full border-b border-line bg-transparent py-2 font-editorial text-heading text-paper placeholder:text-paper/25 focus:border-paper focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("navigation.closeSearch")}
          className="pb-3 text-label text-paper/50 transition-colors hover:text-paper"
        >
          {t("common.close")}
        </button>
      </form>
    </motion.div>
  );
}
