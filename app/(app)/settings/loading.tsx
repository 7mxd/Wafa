import { Bar } from "@/components/skeletons";

/**
 * Shown instantly while the settings render (payment-details RPC + contacts
 * query) streams in. Without this, opening Settings from the header had no
 * skeleton boundary, so the click sat on the previous page until both round
 * trips finished — which read as a lag.
 */
export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-xl px-5 py-7 sm:px-6 sm:py-8">
      <Bar className="h-4 w-16 rounded" />
      <Bar className="mt-4 h-7 w-32 rounded-md" />
      <Bar className="mt-2 h-4 w-44 rounded" />

      {/* Payment details */}
      <div className="mt-5 space-y-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        <Bar className="h-4 w-32 rounded" />
        <Bar className="h-3.5 w-full max-w-sm rounded" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Bar className="h-3.5 w-24 rounded" />
            <Bar className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Bar className="h-11 w-full rounded-xl" />
      </div>

      {/* Your people */}
      <div className="mt-5 space-y-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-[0_10px_30px_-20px_rgba(36,58,138,0.22)] sm:p-6">
        <Bar className="h-4 w-28 rounded" />
        <Bar className="h-3.5 w-full max-w-sm rounded" />
        <Bar className="h-11 w-full rounded-xl" />
      </div>
    </main>
  );
}
