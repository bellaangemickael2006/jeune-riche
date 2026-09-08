"use client";

import { useEffect, useState } from "react";

function msRemaining(target: number) {
  return Math.max(0, target - Date.now());
}

function split(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function CountdownTimer({
  target,
  label,
  variant = "banner",
}: {
  /** Date cible ISO. */
  target: string;
  /** Libellé affiché au-dessus des chiffres (variant "banner" uniquement). */
  label?: string;
  variant?: "banner" | "badge";
}) {
  const targetMs = new Date(target).getTime();
  // `Date.now()` diffère entre le rendu serveur et l'hydratation client :
  // tout calcul avant le montage provoquerait un mismatch. Le vrai compte à
  // rebours ne s'affiche donc qu'une fois monté côté client.
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
    setRemaining(msRemaining(targetMs));
    const tickMs = variant === "badge" ? 60_000 : 1_000;
    const id = setInterval(() => setRemaining(msRemaining(targetMs)), tickMs);
    return () => clearInterval(id);
  }, [targetMs, variant]);

  if (!mounted || remaining <= 0) return null;

  const { days, hours, minutes, seconds } = split(remaining);

  if (variant === "badge") {
    const text = days > 0 ? `${days} j ${hours} h` : hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
    return (
      <span className="bg-ink px-2 py-1 text-[10px] uppercase tracking-widest2 text-paper">{text}</span>
    );
  }

  const units = [
    { value: days, caption: "Jours" },
    { value: hours, caption: "Heures" },
    { value: minutes, caption: "Min" },
    { value: seconds, caption: "Sec" },
  ];

  return (
    <div>
      {label && <p className="mb-2 text-label text-paper/50">{label}</p>}
      <div className="flex gap-2">
        {units.map((u) => (
          <div key={u.caption} className="flex min-w-[3.25rem] flex-col items-center border border-line px-2 py-2">
            <span className="font-display text-lg tabular-nums text-paper">{String(u.value).padStart(2, "0")}</span>
            <span className="text-[9px] uppercase tracking-widest2 text-paper/40">{u.caption}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
