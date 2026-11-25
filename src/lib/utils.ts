import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "EUR";
const SYMBOLS: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", CHF: "CHF ", JPY: "¥" };

/** Deterministic thousands separators (identical on server and in every browser – no ICU differences). */
function group(n: number) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatCurrency(value: number | null | undefined, compact = false) {
  if (value === null || value === undefined) return "—";
  const symbol = SYMBOLS[CURRENCY] ?? `${CURRENCY} `;
  if (!compact) return `${symbol}${group(value)}`;
  const abs = Math.abs(value);
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (abs >= 1e9) return `${symbol}${trim(value / 1e9)}B`;
  if (abs >= 1e6) return `${symbol}${trim(value / 1e6)}M`;
  if (abs >= 1e3) return `${symbol}${trim(value / 1e3)}K`;
  return `${symbol}${group(value)}`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return group(value);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
