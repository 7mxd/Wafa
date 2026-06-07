import { STATUS_META, type LoanStatus } from "@/lib/status";

/**
 * The status pill. On hover/focus it reveals what the status means (a CSS-only
 * tooltip sourced from STATUS_META.blurb), and the same text is exposed to
 * screen readers via an sr-only span. The hover group is scoped (`group/pill`)
 * so it never fires off a surrounding card's `group` hover.
 */
export function StatusPill({ status }: { status: LoanStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="group/pill relative inline-flex cursor-help">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight ring-1 ring-inset ${meta.pill}`}
      >
        {meta.label}
      </span>
      <span className="sr-only">: {meta.blurb}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-30 mt-1.5 w-max max-w-[14rem] rounded-lg bg-ink px-2.5 py-1.5 text-left text-xs font-medium leading-snug text-white opacity-0 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.45)] transition-opacity duration-150 group-hover/pill:opacity-100 group-focus-within/pill:opacity-100 motion-reduce:transition-none"
      >
        {meta.blurb}
      </span>
    </span>
  );
}
