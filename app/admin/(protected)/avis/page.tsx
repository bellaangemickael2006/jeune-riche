import { prisma } from "@/lib/prisma";
import { moderateReview } from "@/lib/actions/reviews";

export default async function AdminReviewsPage() {
  let reviews: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    reviews = await load();
  } catch {
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Avis</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && reviews.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun avis à modérer.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line">
          {reviews.map((r) => (
            <li key={r.id} className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-paper">
                    {r.product.name} — {r.user.name ?? r.user.email}
                  </p>
                  <p className="mt-1 text-xs text-paper/40">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} ·{" "}
                    {r.verifiedOrder ? "Client vérifié" : "Non vérifié"} · {r.status}
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-paper/70">{r.comment}</p>
                </div>
                {r.status === "PENDING" && (
                  <div className="flex shrink-0 gap-2">
                    <form action={async () => { "use server"; await moderateReview(r.id, "APPROVED"); }}>
                      <button className="border border-paper px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-paper">
                        Approuver
                      </button>
                    </form>
                    <form action={async () => { "use server"; await moderateReview(r.id, "REJECTED"); }}>
                      <button className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-paper/60 hover:text-paper">
                        Refuser
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function load() {
  return prisma.review.findMany({
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
  });
}
