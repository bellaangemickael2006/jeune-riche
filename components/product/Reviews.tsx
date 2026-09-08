type Review = {
  id: string;
  rating: number;
  comment: string;
  verifiedOrder: boolean;
  user: { name: string | null };
};

// Le titre « Avis clients » a été retiré : la section qui contient ce bloc
// porte déjà le label « Avis ». Deux titres pour une seule zone, c'est du
// remplissage.
export default function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-body text-paper/45">Aucun avis pour le moment.</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {reviews.map((r) => (
        <li key={r.id} className="border-b border-line pb-6 last:border-b-0">
          <div className="flex items-center gap-3">
            <span className="text-caption tracking-widest text-paper" aria-label={`${r.rating} sur 5`}>
              {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)}
            </span>
            {r.verifiedOrder && <span className="text-label text-paper/35">Client vérifié</span>}
          </div>
          <p className="mt-3 text-body leading-relaxed text-paper/70">{r.comment}</p>
          <p className="mt-2 text-caption text-paper/30">{r.user.name ?? "Client"}</p>
        </li>
      ))}
    </ul>
  );
}
