import type { Metadata } from "next";

// Couvre /admin/login ET /admin/(protected)/* — robots.txt (disallow /admin)
// empêche déjà un robot bien élevé de explorer ces pages, mais n'empêche pas
// Google d'indexer une URL découverte via un lien externe sans jamais la
// crawler. Cette balise est la seconde ligne de défense qui couvre ce cas.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
