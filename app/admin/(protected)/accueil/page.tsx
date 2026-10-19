import { requireAdmin } from "@/lib/auth";
import { getHomeContent } from "@/lib/data/homeContent";
import HomeEditor from "@/components/admin/HomeEditor";

// Toujours la dernière version enregistrée, jamais une copie en cache.
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  // Avant toute lecture — voir lib/auth.ts.
  await requireAdmin();
  const content = await getHomeContent();

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl uppercase text-paper">Page d&apos;accueil</h1>
      <p className="mt-2 max-w-2xl text-sm text-paper/50">
        Changez les images de l&apos;accueil, leur cadrage, leur ordre et leurs textes. Rien n&apos;est visible sur le
        site avant d&apos;avoir cliqué sur « Enregistrer ». Les photos de la section « Nos pièces » viennent des
        fiches produits (menu Produits).
      </p>
      <HomeEditor initial={content} />
    </div>
  );
}
