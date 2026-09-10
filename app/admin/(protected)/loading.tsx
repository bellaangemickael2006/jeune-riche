// Aucune page admin n'avait de loading.tsx : Next.js restait figé sur
// l'ancienne page tant que la nouvelle (souvent plusieurs requêtes Prisma
// séquentielles, voir lib/prisma.ts) n'avait pas fini de charger — aucun
// retour visuel, d'où l'impression que "les onglets mettent du temps à
// s'ouvrir". Un loading.tsx par segment de layout affiche ce squelette
// immédiatement au clic et réactive au passage le prefetch des liens
// (désactivé par défaut pour les routes force-dynamic sans loading.tsx).
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-40 bg-line/20" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 border border-line bg-line/10" />
        ))}
      </div>
      <div className="mt-10 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-line bg-line/10" />
        ))}
      </div>
    </div>
  );
}
