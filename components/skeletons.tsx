/**
 * Loading-state primitives. Used by route `loading.tsx` files so a click paints
 * an on-brand placeholder instantly instead of freezing on the previous page.
 * The pulse is purely a loading signal and is disabled under reduced motion.
 */

/** A single shimmering placeholder block. Pass height, width, and radius. */
export function Bar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-warm-200/70 motion-reduce:animate-none ${className}`}
      aria-hidden
    />
  );
}

/** Placeholder shaped like a <LoanCard>, for the dashboard columns. */
export function LoanCardSkeleton() {
  return (
    <div className="rounded-2xl border border-warm-200 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Bar className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Bar className="h-2.5 w-16 rounded" />
            <Bar className="h-3.5 w-28 rounded-md" />
          </div>
        </div>
        <Bar className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Bar className="h-5 w-24 rounded-md" />
          <Bar className="h-3 w-36 rounded" />
        </div>
        <Bar className="h-3 w-12 rounded" />
      </div>
    </div>
  );
}
