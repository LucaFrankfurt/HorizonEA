/**
 * Date helpers operating on ISO calendar dates (`YYYY-MM-DD`). All maths is
 * done in UTC so server and browser render identical results.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

export function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toISO(parseISO(iso) + days * DAY_MS);
}

/** Whole days from `from` to `to` (negative when `to` is in the past). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseISO(to) - parseISO(from)) / DAY_MS);
}

export function formatDate(iso: string | null | undefined, fallback = "—"): string {
  if (!iso) return fallback;
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Human friendly relative description, e.g. "in 3 months" / "14 days ago". */
export function relativeFromToday(iso: string, today: string): string {
  const days = daysBetween(today, iso);
  const abs = Math.abs(days);
  let text: string;
  if (abs === 0) return "today";
  if (abs < 45) text = `${abs} day${abs === 1 ? "" : "s"}`;
  else if (abs < 548) text = `${Math.round(abs / 30.44)} months`;
  else text = `${(abs / 365.25).toFixed(1)} years`;
  return days > 0 ? `in ${text}` : `${text} ago`;
}

export const isISODate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISO(value));

/** Normalises loosely formatted dates from CSV/JSON (e.g. `2027-1-5`, `2027-01-05T00:00:00Z`). */
export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }
  const de = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (de) return `${de[3]}-${de[2].padStart(2, "0")}-${de[1].padStart(2, "0")}`;
  return text; // let validation report it
}
