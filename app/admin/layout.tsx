import type { Metadata } from "next";

// Couvre /admin/login ET /admin/(protected)/* : une URL d'admin découverte
// via un lien externe ne doit jamais être indexée par Google. Sans le cookie
// de l'entrée secrète, ces pages ne sont même pas servies (next.config.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
