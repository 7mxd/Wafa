import { Bar, LoanCardSkeleton } from "@/components/skeletons";

/**
 * Shown instantly while the dashboard's server render (auth + loan queries)
 * streams in. Static chrome (the ledger band, column headers) is real; only the
 * data-driven figures and cards shimmer.
 */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-7 sm:px-6 sm:py-8">
      <section className="grad-brand relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_18px_44px_-20px_oklch(0.4_0.16_258/0.6)] sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Your ledger
          </h1>
          <div className="h-6 w-24 animate-pulse rounded-full bg-white/20 motion-reduce:animate-none" />
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/15">
          {["Owed to you", "You owe", "Net"].map((label) => (
            <div key={label} className="px-3 first:pl-0 last:pr-0">
              <p className="text-[0.68rem] font-medium uppercase tracking-wide text-white/65">
                {label}
              </p>
              <div className="mt-2 h-6 w-20 animate-pulse rounded-md bg-white/20 motion-reduce:animate-none sm:h-7" />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-7 sm:grid-cols-2">
        {["Owed to me", "I owe"].map((title) => (
          <section key={title}>
            <div className="mb-3">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <Bar className="mt-1.5 h-3 w-28 rounded" />
            </div>
            <div className="space-y-3">
              <LoanCardSkeleton />
              <LoanCardSkeleton />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
