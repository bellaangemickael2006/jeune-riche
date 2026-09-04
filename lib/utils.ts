import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Prix à définir";
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function sanitizePersonalization(input: string, maxLen = 16): string {
  return input
    .replace(/[^a-zA-Z0-9À-ÿ _-]/g, "")
    .slice(0, maxLen);
}
