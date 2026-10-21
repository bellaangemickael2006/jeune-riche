"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useScrollLock } from "@/lib/scrollLock";
import { canSeeLink, type AdminPermissions } from "@/lib/admin/permissions";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/accueil", label: "Page d'accueil" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/avis", label: "Avis" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/codes-promo", label: "Codes promo" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/parametres", label: "Paramètres" },
  { href: "/admin/equipe", label: "Équipe" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/sauvegardes", label: "Sauvegardes" },
];

export default function AdminSidebar({
  badges = {},
  permissions = null,
}: {
  badges?: Record<string, number>;
  /** null = propriétaire : tout le menu. */
  permissions?: AdminPermissions;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // La sidebar était en `fixed w-56` permanent, y compris sur mobile, où
  // elle écrasait le contenu (ml-56 sur un écran de 375px ne laisse presque
  // rien). Devient un tiroir plein écran sous lg (même logique que le menu
  // mobile du site public, voir components/layout/Header.tsx) ; à partir de
  // lg elle redevient la colonne fixe toujours visible d'origine.
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-line bg-ink px-5 py-4 lg:hidden">
        <div>
          <p className="font-display text-sm uppercase tracking-wide text-paper">Jeune Riche</p>
          <p className="text-[10px] uppercase tracking-widest2 text-paper/30">Administration</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-paper"
          aria-label="Menu"
          aria-expanded={open}
        >
          <span className="block h-px w-6 bg-paper" />
          <span className="mt-1.5 block h-px w-6 bg-paper" />
        </button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col justify-between overflow-y-auto border-r border-line bg-ink px-5 py-8 transition-transform duration-300 ease-editorial lg:w-56 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          <p className="hidden font-display text-sm uppercase tracking-wide text-paper lg:block">Jeune Riche</p>
          <p className="mb-8 hidden text-[10px] uppercase tracking-widest2 text-paper/30 lg:block">Administration</p>
          <nav className="mt-16 flex flex-col gap-1 lg:mt-0">
            {LINKS.filter((link) => canSeeLink(permissions, link.href)).map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-xs uppercase tracking-widest2 transition-colors",
                    active ? "bg-paper text-ink" : "text-paper/50 hover:text-paper"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {link.label}
                    {badges[link.href] ? (
                      <span
                        className={cn(
                          "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] leading-none tracking-normal",
                          active ? "bg-ink text-paper" : "bg-paper text-ink"
                        )}
                        aria-label={`${badges[link.href]} à traiter`}
                      >
                        {badges[link.href]}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={logout} className="text-left text-xs uppercase tracking-widest2 text-paper/30 hover:text-paper">
            Déconnexion
          </button>
          <ThemeToggle className="text-paper/40 transition-colors hover:text-paper" />
        </div>
      </aside>

      {open && (
        <button
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-ink/70 lg:hidden"
        />
      )}
    </>
  );
}
