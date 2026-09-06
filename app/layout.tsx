import type { Metadata } from "next";
import { Anton, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CustomCursor from "@/components/ui/CustomCursor";
import WhatsappButton from "@/components/ui/WhatsappButton";
import SmoothScroll from "@/components/providers/SmoothScroll";
import StoreHydration from "@/components/providers/StoreHydration";
import GrainOverlay from "@/components/ui/GrainOverlay";
import { siteUrl } from "@/lib/utils";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "JEUNE RICHE",
    template: "%s — JEUNE RICHE",
  },
  description: "JEUNE RICHE — luxe streetwear, identité tribale.",
  openGraph: {
    title: "JEUNE RICHE",
    description: "JEUNE RICHE — luxe streetwear, identité tribale.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JEUNE RICHE",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${anton.variable} ${fraunces.variable} ${inter.variable}`}>
      <body className="bg-ink font-body text-paper antialiased">
        <StoreHydration />
        <SmoothScroll />
        <GrainOverlay />
        <CustomCursor />
        <Header />
        <main>{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsappButton />
      </body>
    </html>
  );
}
