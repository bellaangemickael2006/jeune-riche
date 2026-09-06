import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export default function Marquee({
  children,
  direction = "left",
  className,
}: {
  children: ReactNode;
  direction?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max gap-6",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        )}
      >
        <div className="flex shrink-0 gap-6">{children}</div>
        <div className="flex shrink-0 gap-6" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
