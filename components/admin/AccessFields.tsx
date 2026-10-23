"use client";

import { useState } from "react";
import { ALL_PERMISSIONS, PERMISSIONS, type Permission } from "@/lib/admin/permissions";

/**
 * Cases « Tous les droits » + une case par section. Cocher « Tous les
 * droits » fait de la personne un propriétaire (accès total, gestion de
 * l'équipe, formatage).
 */
export default function AccessFields({
  initialOwner = false,
  initial = [],
  idPrefix,
}: {
  initialOwner?: boolean;
  initial?: Permission[];
  idPrefix: string;
}) {
  const [owner, setOwner] = useState(initialOwner);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-3 text-sm text-paper">
        <input
          type="checkbox"
          name="proprietaire"
          checked={owner}
          onChange={(e) => setOwner(e.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          Tous les droits (propriétaire)
          <span className="block text-[11px] text-paper/60">Accès complet, gestion de l&apos;équipe et formatage des données.</span>
        </span>
      </label>
      <fieldset disabled={owner} className={owner ? "opacity-40" : undefined}>
        <legend className="sr-only">Sections accessibles</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_PERMISSIONS.map((p) => (
            <label key={p} htmlFor={`${idPrefix}-${p}`} className="flex items-start gap-3 text-sm text-paper/80">
              <input
                id={`${idPrefix}-${p}`}
                type="checkbox"
                name="permissions"
                value={p}
                defaultChecked={initial.includes(p)}
                className="mt-1 h-4 w-4"
              />
              <span>
                {PERMISSIONS[p].label}
                <span className="block text-[11px] text-paper/60">{PERMISSIONS[p].hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
