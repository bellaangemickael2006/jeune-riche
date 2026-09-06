"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Spotlight({
  children,
  size = 500,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  size?: number;
  className?: string;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
  }

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn("relative", className)}
    >
      {children}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(${size}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(245,244,241,0.08), transparent 70%)`,
        }}
      />
    </Tag>
  );
}
