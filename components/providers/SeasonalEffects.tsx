"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";

export type ActiveEvent = {
  accent: string;
  bannerText: string | null;
  effectSnow: boolean;
  effectLights: boolean;
};

const BULB_COUNT = 24;
const FLAKE_COUNT = 70;

// Flocons dessinés sur un canvas fixe, sans bloquer les clics. Une seule
// boucle d'animation, arrêtée quand l'onglet n'est pas visible.
function Snow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Positions en proportion de l'écran (0 à 1), pas en pixels : la taille
    // de la fenêtre peut valoir 0 au premier rendu, ou changer ensuite.
    const flakes = Array.from({ length: FLAKE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.5,
      speed: 0.3 + Math.random() * 0.9,
      drift: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      if (width === 0 || height === 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      for (const f of flakes) {
        f.y += f.speed / height;
        f.drift += 0.01;
        f.x += (Math.sin(f.drift) * 0.4) / width;
        if (f.y > 1.01) {
          f.y = -0.01;
          f.x = Math.random();
        }
        ctx.beginPath();
        ctx.arc(f.x * width, f.y * height, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}

// Guirlande : ampoules qui scintillent en décalé, en haut de la page.
function Lights({ accent, animate }: { accent: string; animate: boolean }) {
  const colors = [accent, "#F2C14E", "#2E8B57", "#F4EFE6"];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[62] flex justify-between px-2">
      <style>{`@keyframes jr-twinkle{0%,100%{opacity:1}50%{opacity:.25}}`}</style>
      <span className="absolute inset-x-0 top-1 h-px bg-paper/40" />
      {Array.from({ length: BULB_COUNT }, (_, i) => (
        <span
          key={i}
          className="relative h-2.5 w-2.5 rounded-full"
          style={{
            marginTop: i % 2 === 0 ? 4 : 7,
            background: colors[i % colors.length],
            boxShadow: `0 0 8px ${colors[i % colors.length]}`,
            animation: animate ? `jr-twinkle 1.6s ease-in-out ${(i % 4) * 0.4}s infinite` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function SeasonalEffects({ event }: { event: ActiveEvent | null }) {
  const pathname = usePathname();
  const reduced = useReducedMotion() ?? false;
  const [bannerClosed, setBannerClosed] = useState(false);

  if (!event || pathname.startsWith("/admin")) return null;

  return (
    <>
      {event.bannerText && !bannerClosed && (
        <div
          className="relative z-[61] flex items-center justify-center gap-4 px-10 py-2 text-center text-xs uppercase tracking-widest2 text-paper"
          style={{ background: event.accent }}
        >
          <span>{event.bannerText}</span>
          <button
            type="button"
            aria-label="Fermer la bannière"
            onClick={() => setBannerClosed(true)}
            className="absolute right-3 flex h-8 w-8 items-center justify-center"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      )}
      {event.effectLights && <Lights accent={event.accent} animate={!reduced} />}
      {event.effectSnow && !reduced && <Snow />}
    </>
  );
}
