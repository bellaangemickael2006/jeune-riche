"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CustomCursor from "@/components/ui/CustomCursor";
import WhatsappButton from "@/components/ui/WhatsappButton";
import SmoothScroll from "@/components/providers/SmoothScroll";
import GrainOverlay from "@/components/ui/GrainOverlay";
import InstallPrompt from "@/components/providers/InstallPrompt";

// L'admin a son propre shell (AdminSidebar, voir app/admin/(protected)/layout.tsx)
// et doit rester un outil de gestion sobre : le header fixe du site client
// (nav, panier, favoris) se superposait par-dessus l'interface admin — au
// même endroit à l'écran que ses propres boutons — et interceptait les
// clics ("nouveau produit" ouvrait le panier). Le curseur personnalisé, le
// grain et le smooth-scroll éditorial n'ont pas non plus leur place dans un
// tableau de bord de gestion.
//
// `adminShell` vient du serveur (proxy.ts → layout) : une page admin cachée
// par la porte secrète (lib/admin/gate.ts) doit ressembler en tout point à
// une page 404 ordinaire, header et footer compris — impossible à décider
// d'après la seule adresse du navigateur, qui reste /admin. Pour la page
// chargée, on suit donc le serveur ; après une navigation, l'adresse.
export default function SiteChrome({ children, adminShell }: { children: React.ReactNode; adminShell: boolean }) {
  const pathname = usePathname();
  const [firstPathname] = useState(pathname);
  const isAdmin = pathname === firstPathname ? adminShell : pathname?.startsWith("/admin");

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
      <InstallPrompt />
    </>
  );
}
