"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useLocale } from "@/components/providers/I18nProvider";
import { cn, formatPrice } from "@/lib/utils";
import { SEARCH_MAX_LENGTH } from "@/lib/catalogue/search";
import type { SearchSuggestion } from "@/app/api/search/route";

const DEBOUNCE_MS = 150;

/**
 * Fenêtre de recherche du header, avec suggestions pendant la frappe
 * (/api/search). Clavier : flèches pour parcourir, Entrée pour ouvrir la
 * pièce choisie ou tous les résultats, Échap pour fermer (géré par Header).
 */
export default function SearchPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searched, setSearched] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (!q) return;
    // Une seule requête en vol : la frappe suivante annule la précédente.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = (await res.json()) as { suggestions?: SearchSuggestion[] };
        setSuggestions(data.suggestions ?? []);
        setSearched(q);
        setActive(-1);
      } catch {
        // Hors connexion ou requête annulée : la recherche par Entrée reste possible.
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  const query = value.trim();
  const shown = query ? suggestions : [];
  const showResults = Boolean(query) && searched === query;

  function go(href: string) {
    router.push(href);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && shown[active]) return go(`/catalogue/${shown[active].slug}`);
    if (query) go(`/catalogue?q=${encodeURIComponent(query)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!shown.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-line bg-ink px-5 py-6 md:px-10 md:py-8"
    >
      <form onSubmit={handleSubmit} role="search" className="mx-auto max-w-2xl">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <p className="text-label text-paper/40">{t("navigation.search")}</p>
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={shown.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
              value={value}
              maxLength={SEARCH_MAX_LENGTH}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("navigation.searchPlaceholder")}
              className="mt-2 w-full border-b border-line bg-transparent py-2 font-editorial text-heading text-paper placeholder:text-paper/25 focus:border-paper focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("navigation.closeSearch")}
            className="pb-3 text-label text-paper/50 transition-colors hover:text-paper"
          >
            {t("common.close")}
          </button>
        </div>

        {showResults && (
          <div className="mt-4">
            {shown.length === 0 ? (
              <p className="text-caption text-paper/50">{t("navigation.searchNoResults", { query })}</p>
            ) : (
              <>
                <ul id={listId} role="listbox" aria-label={t("navigation.searchSuggestions")} className="divide-y divide-line">
                  {shown.map((s, i) => (
                    <li
                      key={s.slug}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(`/catalogue/${s.slug}`)}
                      className={cn("flex cursor-pointer items-center gap-4 py-3", i === active && "bg-paper/5")}
                    >
                      <span className="relative h-12 w-10 shrink-0 overflow-hidden bg-studio">
                        {s.image && <Image src={s.image} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body text-paper">{s.name}</span>
                        <span className="block text-caption text-paper/40">{s.category}</span>
                      </span>
                      <span className="shrink-0 text-caption text-paper/70">
                        {formatPrice(s.price, locale, t("product.priceUndefined"))}
                      </span>
                    </li>
                  ))}
                </ul>
                <button type="submit" className="mt-4 text-label text-paper/60 underline underline-offset-4 hover:text-paper">
                  {t("navigation.searchSeeAll")}
                </button>
              </>
            )}
          </div>
        )}
      </form>
    </motion.div>
  );
}
