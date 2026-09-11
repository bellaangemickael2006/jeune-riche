"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useTranslation } from "react-i18next";
import { createReview, type CreateReviewState } from "@/lib/actions/reviews";
import { cn } from "@/lib/utils";

export default function ReviewForm({
  productId,
  productSlug,
  isLoggedIn,
}: {
  productId: string;
  productSlug: string;
  isLoggedIn: boolean;
}) {
  const { t } = useTranslation();
  const boundAction = createReview.bind(null, productId, productSlug);
  const [state, formAction, pending] = useActionState<CreateReviewState, FormData>(boundAction, null);
  const [rating, setRating] = useState(5);

  if (!isLoggedIn) {
    return (
      <p className="mt-6 border-t border-line pt-6 text-sm text-paper/50">
        <Link href="/compte" className="underline underline-offset-4 hover:text-paper">
          {t("product.loginToReview")}
        </Link>{" "}
        {t("product.loginToReviewSuffix")}
      </p>
    );
  }

  if (state?.ok) {
    return <p className="mt-6 border-t border-line pt-6 text-sm text-paper/70">{state.message}</p>;
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
      <p className="text-label text-paper/50">{t("product.leaveReview")}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={t("product.starRating", { count: n })}
            aria-pressed={n === rating}
            className={cn("text-lg leading-none transition-colors", n <= rating ? "text-paper" : "text-paper/25 hover:text-paper/50")}
          >
            ★
          </button>
        ))}
        <input type="hidden" name="rating" value={rating} />
      </div>
      <textarea
        name="comment"
        required
        minLength={5}
        rows={3}
        placeholder={t("product.reviewPlaceholder")}
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
      />
      {state && !state.ok && <p className="text-xs text-paper/60">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? t("product.sending") : t("product.publishReview")}
      </button>
    </form>
  );
}
