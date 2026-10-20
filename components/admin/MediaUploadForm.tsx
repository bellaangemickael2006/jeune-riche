"use client";

import { useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  addProductImage,
  addProductModel,
  setProductVideo,
  removeProductVideo,
  prepareMediaUpload,
} from "@/lib/actions/products";
import { createClient } from "@/lib/supabase/client";

const IMAGE_TYPES = ["MOCKUP", "FRONT", "BACK", "DETAIL", "LIFESTYLE"] as const;
const MEDIA_BUCKET = "product-media";

/**
 * Envoie le fichier directement du navigateur vers Supabase Storage via une
 * URL signée délivrée par le serveur (voir prepareMediaUpload). Renvoie le
 * chemin stocké, ou un message d'erreur lisible.
 */
async function uploadMedia(
  productId: string,
  kind: "image" | "video" | "model",
  file: File
): Promise<{ path: string } | { error: string }> {
  const prepared = await prepareMediaUpload(productId, kind, { name: file.name, type: file.type, size: file.size });
  if (!prepared.ok) return { error: prepared.error };

  // Sans type MIME correct, le .glb serait servi en octet-stream et certains
  // visualiseurs (AR sur Android) le refuseraient.
  const contentType = kind === "model" ? "model/gltf-binary" : file.type;
  const { error } = await createClient()
    .storage.from(MEDIA_BUCKET)
    .uploadToSignedUrl(prepared.data.path, prepared.data.token, file, { contentType });
  if (error) return { error: `Échec de l'envoi : ${error.message}` };
  return { path: prepared.data.path };
}

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
    setError(null);
    startTransition(async () => {
      try {
        const uploaded = await uploadMedia(productId, "image", file);
        if ("error" in uploaded) {
          setError(uploaded.error);
          return;
        }
        const formData = new FormData();
        formData.set("path", uploaded.path);
        formData.set("alt", alt);
        formData.set("type", type);
        formData.set("color", color);
        const result = await addProductImage(productId, formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setAlt("");
        setColor("");
        fileHeld.current = null;
        if (fileRef.current) fileRef.current.value = "";
      } catch {
        setError("Échec de l'envoi. Vérifiez la connexion et réessayez.");
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
      {error && <p className="w-full text-xs font-medium text-paper">{error}</p>}
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
    setError(null);
    startTransition(async () => {
      try {
        const uploaded = await uploadMedia(productId, "video", file);
        if ("error" in uploaded) {
          setError(uploaded.error);
          return;
        }
        const formData = new FormData();
        formData.set("path", uploaded.path);
        const result = await setProductVideo(productId, formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        fileHeld.current = null;
        if (fileRef.current) fileRef.current.value = "";
      } catch {
        setError("Échec de l'envoi. Vérifiez la connexion et réessayez.");
      }
    });
  }

  function onRemove() {
    if (!window.confirm("Retirer la vidéo de ce produit ?")) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await removeProductVideo(productId);
        if (!result.ok) setError(result.error);
      } catch {
        setError("Échec. Vérifiez la connexion.");
      }
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
            className="text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper"
          >
            Retirer la vidéo
          </button>
        )}
      </form>
      {error && <p className="mt-2 text-xs font-medium text-paper">{error}</p>}
    </div>
  );
}

const ModelPreview = dynamic(() => import("@/components/product/ModelViewer3D"), { ssr: false });
const PREVIEW_LABELS = {
  hint: "Glissez pour faire tourner",
  loading: "Chargement du modèle…",
  error: "Fichier illisible : réexportez-le en .glb depuis VirtualThreads.",
  ar: "AR",
};

/**
 * Modèle 3D exporté depuis VirtualThreads (.glb), un par couleur. L'aperçu
 * montre le fichier local en 3D avant l'envoi, exactement comme sur la fiche.
 */
export function ModelUploadForm({ productId, colors }: { productId: string; colors: string[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [color, setColor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const fileHeld = useRef<File | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    setMessage(null);
    fileHeld.current = file;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileHeld.current;
    if (!file) {
      setError("Sélectionnez le fichier .glb exporté depuis VirtualThreads.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const uploaded = await uploadMedia(productId, "model", file);
        if ("error" in uploaded) {
          setError(uploaded.error);
          return;
        }
        const formData = new FormData();
        formData.set("path", uploaded.path);
        formData.set("color", color);
        const result = await addProductModel(productId, formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.message ?? "Modèle 3D ajouté.");
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        fileHeld.current = null;
        if (fileRef.current) fileRef.current.value = "";
      } catch {
        setError("Échec de l'envoi. Vérifiez la connexion et réessayez.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest2 text-paper/40">Fichier .glb</span>
          <input
            ref={fileRef}
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={onFileChange}
            className="w-64 text-xs text-paper/70 file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-widest2 file:text-paper"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40">Couleur du modèle</span>
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
        <button
          type="submit"
          disabled={isPending}
          className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper disabled:opacity-40"
        >
          {isPending ? "Envoi…" : "Confirmer l'ajout"}
        </button>
      </div>
      {preview && (
        <div className="relative aspect-4/5 w-full max-w-xs overflow-hidden border border-line bg-studio">
          <ModelPreview src={preview} alt="Aperçu du modèle 3D" labels={PREVIEW_LABELS} />
        </div>
      )}
      {error && <p className="text-xs font-medium text-paper">{error}</p>}
      {message && <p className="text-xs text-paper/60">{message}</p>}
    </form>
  );
}
