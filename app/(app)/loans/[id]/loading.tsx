import { Bar } from "@/components/skeletons";

/**
 * Shown instantly while a loan's detail render (auth + loan, events, IBAN)
 * streams in. Mirrors the real detail layout so the swap is seamless.
 */
export default function LoanDetailLoading() {
  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <Bar className="h-4 w-16 rounded" />

      <div className="mt-4 overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-[0_12px_36px_-22px_rgba(36,58,138,0.28)]">
        <div className="flex items-start justify-between gap-3 border-b border-warm-100 bg-gradient-to-br from-brand-tint/60 via-transparent to-transparent p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Bar className="h-11 w-11 shrink-0 rounded-full" />
            <div className="space-y-1.5">
              <Bar className="h-2.5 w-20 rounded" />
              <Bar className="h-4 w-32 rounded-md" />
            </div>
          </div>
          <Bar className="h-6 w-20 rounded-full" />
        </div>

        <div className="p-5 sm:p-6">
          <Bar className="h-9 w-40 rounded-md" />
          <Bar className="mt-3.5 h-4 w-3/4 rounded" />
          <div className="mt-3.5 flex gap-3">
            <Bar className="h-4 w-28 rounded" />
            <Bar className="h-4 w-24 rounded" />
          </div>
          <div className="mt-5 space-y-2.5 border-t border-warm-100 pt-5">
            <Bar className="h-11 w-full rounded-xl" />
            <Bar className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-warm-200 bg-card p-5 sm:p-6">
        <Bar className="h-4 w-20 rounded" />
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Bar className="h-7 w-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bar className="h-3.5 w-1/2 rounded" />
                <Bar className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
