"use client";

import { useRef, useState, useTransition } from "react";
import { addProductImage, setProductVideo, removeProductVideo } from "@/lib/actions/products";

const IMAGE_TYPES = ["MOCKUP", "FRONT", "BACK", "DETAIL", "LIFESTYLE"] as const;

export function ImageUploadForm({ productId, colors }: { productId: string; colors: string[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");
  const [type, setType] = useState<(typeof IMAGE_TYPES)[number]>("MOCKUP");
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileHeld = useRef<File | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    fileHeld.current = file;
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileHeld.current;
    if (!file) {
      setError("Sélectionnez une image.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt", alt);
    formData.set("type", type);
    formData.set("color", color);
    startTransition(async () => {
      try {
        await addProductImage(productId, formData);
        setPreview(null);
        setAlt("");
        setColor("");
        fileHeld.current = null;
        if (fileRef.current) fileRef.current.value = "";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-start gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-widest2 text-paper/40">Fichier image</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="w-64 text-xs text-paper/70 file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-widest2 file:text-paper"
        />
        {preview && (
          <div className="relative mt-1 h-32 w-32 overflow-hidden border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un blob: URL, next/image ne le gère pas */}
            <img src={preview} alt="Aperçu" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">Alt</span>
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          className="w-40 border border-line bg-transparent px-3 py-2 text-sm text-paper"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as (typeof IMAGE_TYPES)[number])}
          className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
        >
          {IMAGE_TYPES.map((t) => (
            <option key={t} className="bg-ink" value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      {colors.length > 0 && (
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">
            Couleur (pour changer le rendu selon le nuancier client)
          </span>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border border-line bg-transparent px-3 py-2 text-sm text-paper"
          >
            <option className="bg-ink" value="">
              Toutes couleurs
            </option>
            {colors.map((c) => (
              <option key={c} className="bg-ink" value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper disabled:opacity-40"
      >
        {isPending ? "Envoi…" : "Confirmer l'ajout"}
      </button>
      {error && <p className="w-full text-xs text-blood">{error}</p>}
    </form>
  );
}

export function VideoUploadForm({
  productId,
  currentVideoUrl,
}: {
  productId: string;
  currentVideoUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileHeld = useRef<File | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    fileHeld.current = file;
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileHeld.current;
    if (!file) {
      setError("Sélectionnez une vidéo.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        await setProductVideo(productId, formData);
        setPreview(null);
        fileHeld.current = null;
        if (fileRef.current) fileRef.current.value = "";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'ajout.");
      }
    });
  }

  function onRemove() {
    startTransition(async () => {
      await removeProductVideo(productId);
    });
  }

  const displaySrc = preview ?? currentVideoUrl;

  return (
    <div className="mt-4">
      {displaySrc && (
        <video
          key={displaySrc}
          src={displaySrc}
          controls
          muted
          className="h-48 w-full max-w-sm border border-line bg-ink object-cover"
        />
      )}
      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          onChange={onFileChange}
          className="text-xs text-paper/70 file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-widest2 file:text-paper"
        />
        <button
          type="submit"
          disabled={isPending}
          className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper disabled:opacity-40"
        >
          {isPending ? "Envoi…" : preview ? "Confirmer l'ajout" : "Remplacer la vidéo"}
        </button>
        {currentVideoUrl && !preview && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isPending}
            className="text-xs uppercase tracking-widest2 text-blood/70 hover:text-blood"
          >
            Retirer la vidéo
          </button>
        )}
      </form>
      {error && <p className="mt-2 text-xs text-blood">{error}</p>}
    </div>
  );
}
