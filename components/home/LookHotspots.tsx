"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export type LookHotspot = {
  id: number;
  // Position en pourcentage de la photo — à ajuster sur la vraie image.
  x: number;
  y: number;
  name: string;
  href: string;
};

// Points cliquables posés par-dessus une photo de look (passée en enfant).
// Au survol ou au tap, le nom de la pièce apparaît et le point mène à sa
// fiche produit.
export default function LookHotspots({
  children,
  hotspots,
}: {
  children: ReactNode;
  hotspots: LookHotspot[];
}) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative">
      {children}

      {hotspots.map((spot, i) => {
        const isOpen = active === spot.id;
        return (
          <div
            key={spot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onMouseEnter={() => setActive(spot.id)}
            onMouseLeave={() => setActive(null)}
          >
            <motion.button
              type="button"
              aria-label={`Voir ${spot.name}`}
              aria-expanded={isOpen}
              onClick={() => setActive(isOpen ? null : spot.id)}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-xs font-semibold text-ink shadow-lg"
            >
              {i + 1}
            </motion.button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap"
                >
                  <Link
                    href={spot.href}
                    className="block bg-paper px-3 py-2 text-xs uppercase tracking-widest2 text-ink"
                  >
                    {spot.name}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
