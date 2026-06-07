/**
 * Shared Tailwind class vocabulary. One source of truth so every input, label,
 * and button looks identical screen to screen (a product-UI virtue).
 */

export const inputClass =
  "w-full rounded-xl border border-warm-300 bg-card px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-warm-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

export const labelClass = "text-xs font-medium text-warm-500";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition duration-150 ease-[var(--ease-out-quint)] focus-ring disabled:opacity-60 disabled:pointer-events-none";

export const btnPrimary = `${btnBase} bg-brand px-4 py-2.5 text-white shadow-sm hover:bg-brand-strong active:translate-y-px`;

export const btnSecondary = `${btnBase} border border-warm-300 bg-card px-4 py-2.5 text-warm-800 hover:border-warm-400 hover:bg-paper active:translate-y-px`;

export const btnDanger = `${btnBase} border border-rose-300 bg-card px-4 py-2.5 text-rose-700 hover:bg-rose-50 active:translate-y-px`;

export const btnCoral = `${btnBase} bg-coral px-4 py-2.5 text-white shadow-sm hover:bg-coral-strong active:translate-y-px`;
