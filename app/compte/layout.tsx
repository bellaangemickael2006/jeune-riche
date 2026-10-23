import type { Metadata } from "next";

// Espace personnel (et ses sous-pages) : exclu des moteurs de recherche.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
