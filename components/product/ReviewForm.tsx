"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createReview, prepareReviewPhotoUpload, type CreateReviewState } from "@/lib/actions/reviews";
import { MAX_REVIEW_PHOTOS } from "@/lib/reviewPhotosConfig";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MEDIA_BUCKET = "product-media";
const MAX_SIDE = 1600;

type Picked = { blob: Blob; preview: string };

/**
 * Réduit la photo dans le navigateur (≤ 1600 px, JPEG) : une photo de
 * téléphone fait souvent 5 à 12 Mo, beaucoup trop sur un réseau mobile.
 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("compression");
  return blob;
}

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
  const [photos, setPhotos] = useState<Picked[]>([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Libère les aperçus blob: au démontage.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

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

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_REVIEW_PHOTOS - photos.length);
    e.target.value = "";
    setPhotoError(null);
    const added: Picked[] = [];
    for (const file of files) {
      try {
        const blob = await shrink(file);
        added.push({ blob, preview: URL.createObjectURL(blob) });
      } catch {
        setPhotoError(t("product.reviewPhotoInvalid"));
      }
    }
    setPhotos((prev) => [...prev, ...added].slice(0, MAX_REVIEW_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setPhotoError(null);
    if (photos.length > 0) {
      setUploading(true);
      try {
        const supabase = createClient();
        for (const photo of photos) {
          const prepared = await prepareReviewPhotoUpload({ type: photo.blob.type, size: photo.blob.size });
          if (!prepared.ok) throw new Error(prepared.message);
          const { error } = await supabase.storage
            .from(MEDIA_BUCKET)
            .uploadToSignedUrl(prepared.path, prepared.token, photo.blob, { contentType: photo.blob.type });
          if (error) throw new Error(t("product.reviewPhotoUploadError"));
          formData.append("photos", prepared.path);
        }
      } catch (error) {
        setPhotoError(error instanceof Error ? error.message : t("product.reviewPhotoUploadError"));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    startTransition(() => formAction(formData));
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
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

      <div className="flex flex-wrap items-center gap-2">
        {photos.map((photo, i) => (
          <div key={photo.preview} className="relative h-16 w-16 overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un blob: URL */}
            <img src={photo.preview} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label={t("product.reviewPhotoRemove")}
              className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-ink/80 text-[11px] text-paper"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_REVIEW_PHOTOS && (
          <label className="flex h-16 cursor-pointer items-center justify-center border border-dashed border-line px-4 text-[11px] uppercase tracking-widest2 text-paper/50 transition-colors hover:border-paper hover:text-paper">
            + {t("product.reviewAddPhotos")}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPick} className="sr-only" />
          </label>
        )}
      </div>
      <p className="text-[11px] text-paper/35">{t("product.reviewPhotosHint", { count: MAX_REVIEW_PHOTOS })}</p>

      {state && !state.ok && <p className="text-xs text-paper/60">{state.message}</p>}
      {photoError && <p className="text-xs text-paper/60">{photoError}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {uploading ? t("product.reviewPhotoUploading") : pending ? t("product.sending") : t("product.publishReview")}
      </button>
    </form>
  );
}
