// Filet de sécurité pour les pages du site sans loading.tsx dédié (checkout,
// panier, contact, manifeste...) — voir app/admin/(protected)/loading.tsx
// pour le même correctif côté admin. Générique à dessein : sert de squelette
// de repli pour n'importe quelle page, le temps que son propre contenu
// (souvent une requête serveur) arrive.
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 pt-20">
      <div className="h-px w-24 animate-pulse bg-paper/30" />
    </div>
  );
}
