"use client";

import { useEffect, useRef, useState } from "react";

// Visionneuse 3D des modèles .glb exportés depuis VirtualThreads, basée sur
// <model-viewer> de Google : rotation 360° au doigt ou à la souris, zoom,
// et réalité augmentée sur téléphone (Android et iPhone). La librairie
// (~1 Mo) n'est téléchargée qu'à l'ouverture de la vue 3D.

let loader: Promise<unknown> | null = null;
function loadModelViewer() {
  loader ??= import("@google/model-viewer");
  return loader;
}

type Labels = { hint: string; loading: string; error: string; ar: string };

export default function ModelViewer3D({
  src,
  alt,
  poster,
  labels,
}: {
  src: string;
  alt: string;
  poster?: string;
  labels: Labels;
}) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadModelViewer()
      .then(() => !cancelled && setReady(true))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Nouveau fichier (changement de couleur) : on repart de zéro.
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setProgress(0);
  }, [src]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const onProgress = (e: Event) => setProgress((e as CustomEvent<{ totalProgress: number }>).detail.totalProgress);
    const onLoad = () => setLoaded(true);
    const onError = () => setFailed(true);
    const onCamera = (e: Event) => {
      if ((e as CustomEvent<{ source: string }>).detail.source === "user-interaction") setTouched(true);
    };
    el.addEventListener("progress", onProgress);
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    el.addEventListener("camera-change", onCamera);
    // Fichier déjà en cache : « load » a pu partir avant cet abonnement.
    if ((el as HTMLElement & { loaded?: boolean }).loaded) setLoaded(true);
    return () => {
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
      el.removeEventListener("camera-change", onCamera);
    };
    // `src` : l'élément est recréé à chaque fichier (key), il faut réabonner.
  }, [ready, src]);

  return (
    <div data-lenis-prevent className="relative h-full w-full">
      {ready && (
        <model-viewer
          ref={ref}
          key={src}
          src={src}
          alt={alt}
          poster={poster}
          camera-controls
          auto-rotate
          auto-rotate-delay={0}
          rotation-per-second="24deg"
          interaction-prompt="none"
          // Glisser horizontalement fait tourner la pièce ; verticalement, la
          // page continue de défiler sur mobile.
          touch-action="pan-y"
          shadow-intensity="1"
          shadow-softness="0.9"
          exposure="1"
          environment-image="neutral"
          min-camera-orbit="auto 40deg auto"
          max-camera-orbit="auto 110deg auto"
          ar
          ar-modes="webxr scene-viewer quick-look"
          loading="eager"
          style={{ width: "100%", height: "100%", background: "transparent", outline: "none" }}
        >
          <button
            slot="ar-button"
            type="button"
            className="absolute bottom-3 right-3 bg-ink/85 px-3 py-2 text-label uppercase text-paper"
          >
            {labels.ar}
          </button>
          <div slot="progress-bar" />
        </model-viewer>
      )}

      {!loaded && !failed && (
        <div className="pointer-events-none absolute inset-x-6 bottom-6">
          <p className="mb-2 text-center text-label text-ink/60">{labels.loading}</p>
          <div className="h-0.5 w-full bg-ink/10">
            <div className="h-full bg-ink/60 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
      )}
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-ink/60">
          {labels.error}
        </p>
      )}
      {loaded && (
        <p
          className={`pointer-events-none absolute inset-x-0 top-4 text-center text-label text-ink/50 transition-opacity duration-500 ${
            touched ? "opacity-0" : "opacity-100"
          }`}
        >
          {labels.hint}
        </p>
      )}
    </div>
  );
}
