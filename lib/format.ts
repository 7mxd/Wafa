/** Group an amount without the currency, e.g. 1200 -> "1,200". */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format an amount as AED, e.g. 1200 -> "AED 1,200". */
export function formatAed(amount: number): string {
  return `AED ${formatAmount(amount)}`;
}

/** Format an ISO date (or date string) as "20 Jun 2026". */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format a timestamp as "20 Jun, 14:30". */
export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Group an IBAN into 4-char blocks for display: "AE07 0331 2345 …". */
export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

export type CountdownTone = "ok" | "soon" | "over" | "none";

/** Day-granular countdown to a due date, computed from "today". */
export function dueCountdown(due: string | null): {
  label: string;
  tone: CountdownTone;
} {
  if (!due) return { label: "No due date", tone: "none" };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(`${due.slice(0, 10)}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, tone: "over" };
  if (days === 0) return { label: "Due today", tone: "soon" };
  if (days <= 3) return { label: `Due in ${days}d`, tone: "soon" };
  return { label: `Due in ${days}d`, tone: "ok" };
}

export const COUNTDOWN_TONE_CLASS: Record<CountdownTone, string> = {
  ok: "text-warm-500",
  soon: "text-amber-700",
  over: "text-coral-strong",
  none: "text-warm-400",
};
