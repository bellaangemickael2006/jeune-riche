type Review = {
  id: string;
  rating: number;
  comment: string;
  verifiedOrder: boolean;
  user: { name: string | null };
};

export default function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <div className="mt-10 border-t border-line pt-6">
      <p className="text-xs uppercase tracking-widest2 text-paper/50">
        Avis clients {reviews.length > 0 && `(${reviews.length})`}
      </p>
      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-paper/40">Aucun avis pour le moment.</p>
      ) : (
        <ul className="mt-4 space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-line/50 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-paper">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                {r.verifiedOrder && (
                  <span className="text-[10px] uppercase tracking-widest2 text-paper/40">
                    Client vérifié
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-paper/70">{r.comment}</p>
              <p className="mt-1 text-xs text-paper/30">{r.user.name ?? "Client"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
