"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import SmoothScroll from "@/components/providers/SmoothScroll";

// L'admin a son propre shell (AdminSidebar, voir app/admin/(protected)/layout.tsx)
// et doit rester un outil de gestion sobre : le header fixe du site client
// (nav, panier, favoris) se superposait par-dessus l'interface admin — au
// même endroit à l'écran que ses propres boutons — et interceptait les
// clics ("nouveau produit" ouvrait le panier). Le smooth-scroll éditorial n'a
// pas non plus sa place dans un tableau de bord de gestion.
//
// Retirés du site client :
// - CustomCursor : un point de 16px en `mix-blend-mode: exclusion` qui
//   grossissait ×2,2 au survol de tout élément interactif. Il inversait
//   localement le texte qu'il survolait, et c'est l'un des marqueurs les plus
//   reconnaissables d'un site de démonstration. Le curseur natif est rendu.
// - GrainOverlay : un bruit numérique plein écran à 5% censé simuler la
//   matière. La matière se montre par la photographie du textile, pas par une
//   texture posée par-dessus toute l'interface.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SmoothScroll />
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
