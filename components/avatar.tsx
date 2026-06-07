/**
 * A person's initial in a tinted circle. Colour is derived from the name so the
 * same person reads consistently across the ledger, and friends are easy to tell
 * apart at a glance.
 */
const PALETTES = [
  "bg-brand-tint text-brand ring-brand-line",
  "bg-coral-tint text-coral-strong ring-coral-line",
];

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const idx =
    [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTES.length;
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-inset ${PALETTES[idx]}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
