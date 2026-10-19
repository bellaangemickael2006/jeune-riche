"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { prepareSiteImageUpload, resetHomeContent, saveHomeContent } from "@/lib/actions/homeContent";
import { createClient } from "@/lib/supabase/client";
import { RATIOS, type HomeContent, type LookbookItem, type Ratio } from "@/lib/home/content";
import { cn } from "@/lib/utils";

const MEDIA_BUCKET = "product-media";
const RATIO_LABEL: Record<Ratio, string> = { square: "Carré", portrait: "Portrait", landscape: "Paysage" };

/** Envoie l'image directement vers Supabase Storage ; renvoie son URL publique. */
async function uploadSiteImage(file: File): Promise<string> {
  const prepared = await prepareSiteImageUpload({ type: file.type, size: file.size });
  if (!prepared.ok) throw new Error(prepared.error);
  const { error } = await createClient()
    .storage.from(MEDIA_BUCKET)
    .uploadToSignedUrl(prepared.data.path, prepared.data.token, file, { contentType: file.type });
  if (error) throw new Error(`Échec de l'envoi : ${error.message}`);
  return prepared.data.publicUrl;
}

const inputClass = "w-full border border-line bg-transparent px-3 py-2 text-sm text-paper placeholder:text-paper/25 focus:border-paper focus:outline-none";
const labelClass = "mb-1 block text-[10px] uppercase tracking-widest2 text-paper/40";

/**
 * Aperçu d'une image avec choix du cadrage : un clic place le point qui
 * restera toujours visible, quel que soit l'écran (téléphone, ordinateur).
 */
function ImageSlot({
  url,
  focusX,
  focusY,
  aspect,
  fit = "cover",
  overlay,
  onFocus,
  onReplace,
  busy,
  children,
}: {
  url: string;
  focusX?: number;
  focusY?: number;
  aspect: string;
  fit?: "cover" | "contain";
  overlay?: React.ReactNode;
  onFocus?: (x: number, y: number) => void;
  onReplace: (file: File) => void;
  busy: boolean;
  children?: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canFocus = Boolean(onFocus) && fit === "cover";

  function pick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onFocus || !canFocus) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onFocus(Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
  }

  return (
    <div>
      <div
        onClick={pick}
        className={cn("relative w-full overflow-hidden border border-line bg-ink", canFocus && "cursor-crosshair")}
        style={{ aspectRatio: aspect }}
        title={canFocus ? "Cliquez sur la partie de la photo à garder toujours visible" : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- aperçu fidèle du cadrage (object-position) */}
        <img
          src={url}
          alt=""
          className={cn("absolute inset-0 h-full w-full", fit === "cover" ? "object-cover" : "object-contain")}
          style={fit === "cover" ? { objectPosition: `${focusX ?? 50}% ${focusY ?? 50}%` } : undefined}
        />
        {overlay}
        {canFocus && (
          <span
            aria-hidden
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
            style={{ left: `${focusX ?? 50}%`, top: `${focusY ?? 50}%` }}
          />
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/70 text-xs uppercase tracking-widest2 text-paper">
            Envoi…
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="border border-line px-3 py-1.5 text-[10px] uppercase tracking-widest2 text-paper hover:border-paper disabled:opacity-40"
        >
          Remplacer l&apos;image
        </button>
        {canFocus && <span className="text-[11px] text-paper/35">Cliquez sur la photo pour choisir le cadrage.</span>}
        {children}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onReplace(file);
        }}
      />
    </div>
  );
}

/** Texte facultatif : vide = texte traduit par défaut (affiché en gris). */
function TextField({
  label,
  value,
  placeholder,
  max,
  multiline,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  max: number;
  multiline?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          maxLength={max}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      ) : (
        <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
    </label>
  );
}

function Range({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label} — {value} %
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--color-paper))]"
      />
    </label>
  );
}

export default function HomeEditor({ initial }: { initial: HomeContent }) {
  const [content, setContent] = useState<HomeContent>(initial);
  const [saved, setSaved] = useState<HomeContent>(initial);
  const [uploading, setUploading] = useState<string | null>(null); // clé de l'emplacement en cours d'envoi
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const addRef = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(content) !== JSON.stringify(saved);

  // Évite de perdre des réglages en quittant la page sans enregistrer.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (fn: (c: HomeContent) => HomeContent) => {
    setMessage(null);
    setContent((c) => fn(structuredClone(c)));
  };

  async function upload(slot: string, file: File, apply: (url: string) => void) {
    setError(null);
    setUploading(slot);
    try {
      apply(await uploadSiteImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setUploading(null);
    }
  }

  function updateItem(id: string, patch: Partial<LookbookItem>) {
    update((c) => {
      c.lookbook.items = c.lookbook.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      return c;
    });
  }

  function moveItem(index: number, delta: -1 | 1) {
    update((c) => {
      const items = c.lookbook.items;
      const target = index + delta;
      if (target < 0 || target >= items.length) return c;
      [items[index], items[target]] = [items[target], items[index]];
      return c;
    });
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveHomeContent(content);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(content);
      setMessage(result.message ?? "Enregistré.");
    });
  }

  function restoreOriginal() {
    if (!window.confirm("Revenir aux images d'origine de la page d'accueil ? Les images envoyées seront supprimées.")) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await resetHomeContent();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  }

  const { hero, pieces, lookbook, manifeste } = content;

  return (
    <div className="pb-28">
      {/* ---------- Hero ---------- */}
      <section className="mt-10 border border-line p-5">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Grande image d&apos;ouverture</h2>
        <p className="mt-1 text-[11px] text-paper/35">
          Plein écran en haut de l&apos;accueil. Une photo d&apos;au moins 1600 px de large reste nette sur grand écran.
        </p>
        <div className="mt-5 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <ImageSlot
            url={hero.url}
            focusX={hero.focusX}
            focusY={hero.focusY}
            aspect="16 / 9"
            busy={uploading === "hero"}
            onFocus={(x, y) => update((c) => ({ ...c, hero: { ...c.hero, focusX: x, focusY: y } }))}
            onReplace={(file) => upload("hero", file, (url) => update((c) => ({ ...c, hero: { ...c.hero, url } })))}
            overlay={
              <div
                className="pointer-events-none absolute inset-0 flex items-end p-4"
                style={{
                  background: `linear-gradient(to top, #000 0%, rgba(0,0,0,${hero.overlay / 100}) 50%, rgba(0,0,0,${(hero.overlay * 0.8) / 100}) 100%)`,
                }}
              >
                <span className="font-display text-2xl uppercase leading-none text-white">{hero.title || "Jeune Riche"}</span>
              </div>
            }
          />
          <div className="flex flex-col gap-5">
            <Range
              label="Assombrissement derrière le texte"
              value={hero.overlay}
              min={0}
              max={90}
              onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, overlay: v } }))}
            />
            <label className="block">
              <span className={labelClass}>Description de l&apos;image (accessibilité, Google)</span>
              <input
                value={hero.alt}
                maxLength={200}
                onChange={(e) => update((c) => ({ ...c, hero: { ...c.hero, alt: e.target.value } }))}
                placeholder="Ex. T-shirt JEUNE RICHE noir sur un portant d'atelier"
                className={inputClass}
              />
            </label>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-paper/35">
          Textes : laissés vides, ils restent traduits automatiquement dans chaque langue. Un texte saisi
          s&apos;affiche tel quel dans toutes les langues.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Slogan (au-dessus du titre)"
            value={hero.tagline}
            max={80}
            placeholder="LUXE STREETWEAR — IDENTITÉ TRIBALE"
            onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, tagline: v } }))}
          />
          <TextField
            label="Grand titre"
            value={hero.title}
            max={60}
            placeholder="Jeune Riche"
            onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, title: v } }))}
          />
          <TextField
            label="Bouton principal (vers le catalogue)"
            value={hero.ctaPrimary}
            max={40}
            placeholder="Voir le catalogue"
            onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, ctaPrimary: v } }))}
          />
          <TextField
            label="Lien secondaire (vers le manifeste)"
            value={hero.ctaSecondary}
            max={40}
            placeholder="Le manifeste"
            onChange={(v) => update((c) => ({ ...c, hero: { ...c.hero, ctaSecondary: v } }))}
          />
        </div>
      </section>

      {/* ---------- Nos pièces ---------- */}
      <section className="mt-8 border border-line p-5">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Section « Nos pièces »</h2>
        <p className="mt-1 text-[11px] text-paper/35">Les photos viennent des fiches produits (menu Produits).</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Titre de la section"
            value={pieces.title}
            max={60}
            placeholder="Nos pièces"
            onChange={(v) => update((c) => ({ ...c, pieces: { ...c.pieces, title: v } }))}
          />
          <TextField
            label="Texte défilant"
            value={pieces.marquee}
            max={60}
            placeholder="Jeune Riche"
            onChange={(v) => update((c) => ({ ...c, pieces: { ...c.pieces, marquee: v } }))}
          />
        </div>
      </section>

      {/* ---------- Lookbook ---------- */}
      <section className="mt-8 border border-line p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Lookbook — photos portées</h2>
            <p className="mt-1 text-[11px] text-paper/35">Ajoutez, retirez, réordonnez. Texte vide = texte traduit par défaut.</p>
            <div className="mt-3 max-w-xs">
              <TextField
                label="Titre de la section"
                value={lookbook.title}
                max={60}
                placeholder="Porté"
                onChange={(v) => update((c) => ({ ...c, lookbook: { ...c.lookbook, title: v } }))}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-paper/70">
              <input
                type="checkbox"
                checked={lookbook.visible}
                onChange={(e) => update((c) => ({ ...c, lookbook: { ...c.lookbook, visible: e.target.checked } }))}
                className="h-4 w-4"
              />
              Section affichée
            </label>
            <label className="flex items-center gap-2 text-xs text-paper/70">
              Colonnes
              <select
                value={lookbook.columns}
                onChange={(e) =>
                  update((c) => ({ ...c, lookbook: { ...c.lookbook, columns: Number(e.target.value) as 1 | 2 | 3 } }))
                }
                className="border border-line bg-transparent px-2 py-1 text-sm text-paper"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n} className="bg-ink">
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {lookbook.items.map((item, i) => (
            <div key={item.id} className="flex flex-col gap-3">
              <ImageSlot
                url={item.url}
                focusX={item.focusX}
                focusY={item.focusY}
                aspect={RATIOS[item.ratio]}
                busy={uploading === item.id}
                onFocus={(x, y) => updateItem(item.id, { focusX: x, focusY: y })}
                onReplace={(file) => upload(item.id, file, (url) => updateItem(item.id, { url }))}
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={item.ratio}
                  onChange={(e) => updateItem(item.id, { ratio: e.target.value as Ratio })}
                  className="border border-line bg-transparent px-2 py-1 text-xs text-paper"
                  aria-label="Format"
                >
                  {(Object.keys(RATIOS) as Ratio[]).map((r) => (
                    <option key={r} value={r} className="bg-ink">
                      {RATIO_LABEL[r]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  aria-label="Monter"
                  className="border border-line px-2 py-1 text-xs text-paper disabled:opacity-25"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(i, 1)}
                  disabled={i === lookbook.items.length - 1}
                  aria-label="Descendre"
                  className="border border-line px-2 py-1 text-xs text-paper disabled:opacity-25"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update((c) => {
                      c.lookbook.items = c.lookbook.items.filter((x) => x.id !== item.id);
                      return c;
                    })
                  }
                  className="ml-auto text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-paper"
                >
                  Retirer
                </button>
              </div>
              <input
                value={item.caption}
                maxLength={120}
                onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                placeholder="Légende (facultative)"
                className={inputClass}
              />
              <input
                value={item.alt}
                maxLength={200}
                onChange={(e) => updateItem(item.id, { alt: e.target.value })}
                placeholder="Description de l'image"
                className={inputClass}
              />
              <input
                value={item.href}
                maxLength={200}
                onChange={(e) => updateItem(item.id, { href: e.target.value.trim() })}
                placeholder="Lien au clic (ex. /catalogue/t-shirt-jeune-riche)"
                className={inputClass}
              />
            </div>
          ))}

          {lookbook.items.length < 24 && (
            <button
              type="button"
              disabled={uploading === "new"}
              onClick={() => addRef.current?.click()}
              className="flex min-h-48 flex-col items-center justify-center gap-2 border border-dashed border-line text-xs uppercase tracking-widest2 text-paper/50 transition-colors hover:border-paper hover:text-paper disabled:opacity-40"
            >
              <span className="text-2xl leading-none">+</span>
              {uploading === "new" ? "Envoi…" : "Ajouter une photo"}
            </button>
          )}
          <input
            ref={addRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              upload("new", file, (url) =>
                update((c) => {
                  c.lookbook.items.push({
                    id: `photo-${Date.now().toString(36)}`,
                    url,
                    alt: "",
                    caption: "",
                    ratio: "square",
                    focusX: 50,
                    focusY: 50,
                    href: "",
                  });
                  return c;
                })
              );
            }}
          />
        </div>
      </section>

      {/* ---------- Manifeste ---------- */}
      <section className="mt-8 border border-line p-5">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Section Manifeste</h2>
        <p className="mt-1 text-[11px] text-paper/35">Citation, lien et image en filigrane derrière la citation.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr]">
          <TextField
            label="Citation"
            value={manifeste.quote}
            max={300}
            multiline
            placeholder="Une couronne gravée, un visage tribal — le luxe qui ne s'excuse pas d'où il vient."
            onChange={(v) => update((c) => ({ ...c, manifeste: { ...c.manifeste, quote: v } }))}
          />
          <TextField
            label="Lien vers le manifeste"
            value={manifeste.cta}
            max={40}
            placeholder="Entrer dans l'univers"
            onChange={(v) => update((c) => ({ ...c, manifeste: { ...c.manifeste, cta: v } }))}
          />
        </div>
        <div className="mt-5 grid gap-6 md:grid-cols-[1fr_1fr]">
          {manifeste.url ? (
            <ImageSlot
              url={manifeste.url}
              aspect="16 / 9"
              fit="contain"
              busy={uploading === "manifeste"}
              onReplace={(file) =>
                upload("manifeste", file, (url) => update((c) => ({ ...c, manifeste: { ...c.manifeste, url } })))
              }
            >
              <button
                type="button"
                onClick={() => update((c) => ({ ...c, manifeste: { ...c.manifeste, url: null } }))}
                className="text-[10px] uppercase tracking-widest2 text-paper/40 hover:text-paper"
              >
                Retirer l&apos;image
              </button>
            </ImageSlot>
          ) : (
            <ImageSlot
              url="/images/badge/badge-black-on-white.png"
              aspect="16 / 9"
              fit="contain"
              busy={uploading === "manifeste"}
              onReplace={(file) =>
                upload("manifeste", file, (url) => update((c) => ({ ...c, manifeste: { ...c.manifeste, url } })))
              }
              overlay={
                <span className="absolute inset-0 flex items-center justify-center bg-ink/85 text-xs text-paper/60">
                  Aucune image — section sans fond
                </span>
              }
            />
          )}
          <div className="flex flex-col gap-4">
            <Range
              label="Visibilité de l'image"
              value={manifeste.opacity}
              min={0}
              max={30}
              onChange={(v) => update((c) => ({ ...c, manifeste: { ...c.manifeste, opacity: v } }))}
            />
            <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border border-line bg-ink">
              {manifeste.url && (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu de la transparence réelle
                <img
                  src={manifeste.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ opacity: manifeste.opacity / 100 }}
                />
              )}
              <p className="relative px-6 text-center font-editorial text-sm italic text-paper">
                {manifeste.quote || "Une couronne gravée, un visage tribal — le luxe qui ne s'excuse pas d'où il vient."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-line pt-6">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest2 text-paper/60 underline underline-offset-4 hover:text-paper"
        >
          Voir l&apos;accueil en ligne
        </a>
        <button
          type="button"
          onClick={restoreOriginal}
          disabled={isPending}
          className="text-[10px] uppercase tracking-widest2 text-paper/35 hover:text-paper"
        >
          Revenir aux images d&apos;origine
        </button>
      </div>

      {/* ---------- Barre d'enregistrement : compacte, toujours visible ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ink/95 px-4 py-3 backdrop-blur lg:left-56 lg:px-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || isPending || uploading !== null}
            className="flex-1 bg-paper px-4 py-2.5 text-xs uppercase tracking-widest2 text-ink disabled:opacity-40 sm:flex-none sm:px-6"
          >
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={() => {
              setContent(saved);
              setError(null);
              setMessage(null);
            }}
            disabled={!dirty || isPending}
            className="border border-line px-3 py-2.5 text-xs uppercase tracking-widest2 text-paper/70 hover:text-paper disabled:opacity-30 sm:px-4"
          >
            Annuler
          </button>
        </div>
        {dirty && !error && <p className="mt-2 text-[11px] text-paper/50">Modifications non enregistrées.</p>}
        {error && (
          <p role="alert" className="mt-2 text-xs text-paper">
            {error}
          </p>
        )}
        {message && !dirty && (
          <p role="status" className="mt-2 text-xs text-paper/60">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
