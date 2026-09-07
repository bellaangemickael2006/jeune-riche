"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/avis", label: "Avis" },
  { href: "/admin/drops", label: "Drops" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col justify-between border-r border-line bg-ink px-5 py-8">
      <div>
        <p className="font-display text-sm uppercase tracking-wide text-paper">Jeune Riche</p>
        <p className="mb-8 text-[10px] uppercase tracking-widest2 text-paper/30">Administration</p>
        <nav className="flex flex-col gap-1">
          {LINKS.map((link) => {
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
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <button onClick={logout} className="text-left text-xs uppercase tracking-widest2 text-paper/30 hover:text-paper">
        Déconnexion
      </button>
    </aside>
  );
}
