"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CustomCursor from "@/components/ui/CustomCursor";
import WhatsappButton from "@/components/ui/WhatsappButton";
import SmoothScroll from "@/components/providers/SmoothScroll";
import GrainOverlay from "@/components/ui/GrainOverlay";

// L'admin a son propre shell (AdminSidebar, voir app/admin/(protected)/layout.tsx)
// et doit rester un outil de gestion sobre : le header fixe du site client
// (nav, panier, favoris) se superposait par-dessus l'interface admin — au
// même endroit à l'écran que ses propres boutons — et interceptait les
// clics ("nouveau produit" ouvrait le panier). Le curseur personnalisé, le
// grain et le smooth-scroll éditorial n'ont pas non plus leur place dans un
// tableau de bord de gestion.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SmoothScroll />
      <GrainOverlay />
      <CustomCursor />
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsappButton />
    </>
  );
}
