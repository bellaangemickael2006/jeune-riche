import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getReviewPhotos } from "@/lib/data/reviewPhotos";
import { requireAdmin } from "@/lib/auth";
import { moderateReview, deleteReview } from "@/lib/actions/reviews";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { REVIEW_STATUS_LABEL } from "@/lib/adminLabels";

export default async function AdminReviewsPage() {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("avis");
  let reviews: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    reviews = await load();
  } catch (err) {
    console.error("[admin/avis]", err);
    available = false;
  }
  const photos = await getReviewPhotos(reviews.map((r) => r.id));

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Avis</h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && reviews.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun avis pour le moment.</p>
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
                    {r.verifiedOrder ? "Client vérifié" : "Non vérifié"} · {REVIEW_STATUS_LABEL[r.status]}
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-paper/70">{r.comment}</p>
                  {photos[r.id]?.length ? (
                    <div className="mt-3 flex gap-2">
                      {photos[r.id].map((p) => (
                        <a
                          key={p.url}
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block h-20 w-20 overflow-hidden border border-line hover:border-paper"
                        >
                          <Image src={p.url} alt="Photo jointe à l'avis" fill sizes="80px" className="object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {r.status !== "APPROVED" && (
                    <ActionForm action={moderateReview.bind(null, r.id, "APPROVED")}>
                      <SubmitButton className="border border-paper px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-paper">
                        Approuver
                      </SubmitButton>
                    </ActionForm>
                  )}
                  {r.status !== "REJECTED" && (
                    <ActionForm action={moderateReview.bind(null, r.id, "REJECTED")}>
                      <SubmitButton className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-paper/60 hover:text-paper">
                        {r.status === "APPROVED" ? "Masquer" : "Refuser"}
                      </SubmitButton>
                    </ActionForm>
                  )}
                  <ActionForm action={deleteReview.bind(null, r.id)}>
                    <ConfirmButton
                      confirmMessage="Supprimer définitivement cet avis ?"
                      className="px-2 py-1.5 text-[10px] uppercase tracking-widest2 text-paper/30 hover:text-paper"
                    >
                      Supprimer
                    </ConfirmButton>
                  </ActionForm>
                </div>
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
