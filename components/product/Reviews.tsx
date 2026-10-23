"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Review = {
  id: string;
  rating: number;
  comment: string;
  verifiedOrder: boolean;
  user: { name: string | null };
  photos?: { url: string }[];
};

export default function Reviews({ reviews }: { reviews: Review[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const withPhotos = reviews.filter((r) => r.photos?.length).length;

  return (
    <div className="mt-10 border-t border-line pt-6">
      <p className="text-xs uppercase tracking-widest2 text-paper/70">
        {reviews.length > 0
          ? t("product.reviewsHeadingWithCount", { count: reviews.length })
          : t("product.reviewsHeading")}
      </p>
      {withPhotos > 0 && (
        <p className="mt-1 text-[11px] text-paper/60">{t("product.reviewsWithPhotos", { count: withPhotos })}</p>
      )}
      {reviews.length === 0 ? (
        <p className="mt-3 text-sm text-paper/60">{t("product.noReviews")}</p>
      ) : (
        <ul className="mt-4 space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-line/50 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-paper">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                {r.verifiedOrder && (
                  <span className="text-[11px] uppercase tracking-widest2 text-paper/60">
                    {t("product.verifiedCustomer")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-paper/70">{r.comment}</p>
              {r.photos && r.photos.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.photos.map((p, i) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setOpen(p.url)}
                      aria-label={t("product.reviewPhotoOpen", { number: i + 1 })}
                      className="relative h-20 w-20 overflow-hidden bg-studio transition-opacity hover:opacity-80"
                    >
                      <Image src={p.url} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-paper/60">{r.user.name ?? t("product.anonymousCustomer")}</p>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("product.reviewPhotoAlt")}
          onClick={() => setOpen(null)}
          data-lenis-prevent
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink/90 p-5 backdrop-blur-xs"
        >
          <div className="relative h-[80vh] w-full max-w-3xl">
            <Image src={open} alt={t("product.reviewPhotoAlt")} fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain" />
          </div>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={t("product.closeZoom")}
            className="absolute right-5 top-5 h-10 w-10 text-2xl text-paper"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
